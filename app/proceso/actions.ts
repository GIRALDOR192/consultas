"use server";

import prisma from "@/lib/prisma";
import { r2Client, BUCKET_NAME, BASE_DIRECTORY } from "@/lib/r2/client";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// -------------------------------------------------------
// CLIENT PORTAL: Cargar proceso por token
// -------------------------------------------------------

export async function getClientProcessByToken(token: string) {
  try {
    const proc = await prisma.process.findUnique({
      where: { token },
      include: {
        client: {
          select: { name: true, phone: true },
        },
        updates: {
          where: { isPublic: true },
          orderBy: { createdAt: "asc" },
        },
        clientForm: true,
        ritualizations: {
          orderBy: { orderIndex: "asc" }
        }
      },
    });

    if (!proc) return null;

    // Actualizar la última vez que el cliente accedió al portal
    try {
      await prisma.process.update({
        where: { id: proc.id },
        data: { clientLastSeen: new Date() },
      });
    } catch (e) {
      console.error("Error updating client last seen:", e);
    }

    const statusLabels: Record<string, string> = {
      PENDING: "Pendiente",
      PAYMENT_RECEIVED: "Pago Recibido",
      PREPARATION: "En Preparación Energética",
      IN_PROGRESS: "En Proceso",
      SEALED: "Sellado",
      COMPLETED: "Completado",
      PAUSED: "En Pausa",
      CANCELLED: "Cancelado",
      WAITING_CLIENT: "Esperando al Consultante",
    };

    return {
      id: proc.id,
      token: proc.token,
      r2Directory: proc.r2Directory,
      workName: proc.workName,
      clientName: proc.client.name,
      clientPhone: proc.client.phone,
      status: proc.status,
      statusLabel: statusLabels[proc.status] ?? proc.status,
      progressPercent: proc.progressPercent,
      price: proc.price.toString(),
      currency: proc.currency,
      clientMessage: proc.clientMessage,
      hasFormSubmitted: !!proc.clientForm,
      pendingPaymentAmount: proc.pendingPaymentAmount?.toString() || null,
      createdAtStr: proc.createdAt.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      updates: proc.updates.map((u) => ({
        id: u.id,
        title: u.title,
        content: u.content,
        createdAt: u.createdAt.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      })),
      ritualizations: proc.ritualizations.map((r) => ({
        id: r.id,
        name: r.name,
        notes: r.notes,
        isCompleted: r.isCompleted,
        completedAt: r.completedAt ? r.completedAt.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }) : null,
      })),
    };
  } catch (err) {
    console.error("Error loading client process:", err);
    return null;
  }
}

// -------------------------------------------------------
// BITÁCORA EMOCIONAL
// -------------------------------------------------------

export async function addEmotionalLog(
  token: string,
  data: {
    type: string;
    content: string;
    mood?: number;
  }
) {
  try {
    const proc = await prisma.process.findUnique({ where: { token } });
    if (!proc) return { success: false, error: "Proceso no encontrado." };

    await prisma.emotionalLog.create({
      data: {
        processId: proc.id,
        type: data.type,
        content: data.content,
        mood: data.mood ?? null,
      },
    });

    revalidatePath(`/proceso/${token}/bitacora`);
    return { success: true };
  } catch (err: any) {
    console.error("Error adding emotional log:", err);
    return { success: false, error: err.message };
  }
}

export async function getEmotionalLogs(token: string) {
  try {
    const proc = await prisma.process.findUnique({ where: { token } });
    if (!proc) return [];

    const logs = await prisma.emotionalLog.findMany({
      where: { processId: proc.id },
      orderBy: { logDate: "desc" },
    });

    return logs.map((l) => ({
      id: l.id,
      type: l.type,
      content: l.content,
      mood: l.mood,
      logDate: l.logDate.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      logDateRaw: l.logDate.toISOString(),
    }));
  } catch (err) {
    console.error("Error fetching emotional logs:", err);
    return [];
  }
}

// Admin: get emotional logs by processId
export async function getEmotionalLogsByProcessId(processId: string) {
  try {
    const logs = await prisma.emotionalLog.findMany({
      where: { processId },
      orderBy: { logDate: "asc" },
      take: 30,
    });

    return logs.map((l) => ({
      id: l.id,
      type: l.type,
      content: l.content,
      mood: l.mood,
      logDate: l.logDate.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      }),
      logDateRaw: l.logDate.toISOString(),
    }));
  } catch (err) {
    console.error("Error fetching emotional logs by process id:", err);
    return [];
  }
}

// -------------------------------------------------------
// NOTAS PERSONALES DEL CLIENTE
// -------------------------------------------------------

export async function addClientNote(token: string, content: string) {
  try {
    const proc = await prisma.process.findUnique({ where: { token } });
    if (!proc) return { success: false, error: "Proceso no encontrado." };

    await prisma.processNote.create({
      data: {
        processId: proc.id,
        content,
      },
    });

    revalidatePath(`/proceso/${token}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getClientNotes(token: string) {
  try {
    const proc = await prisma.process.findUnique({ where: { token } });
    if (!proc) return [];

    const notes = await prisma.processNote.findMany({
      where: { processId: proc.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return notes.map((n) => ({
      id: n.id,
      content: n.content,
      isPinned: n.isPinned,
      createdAt: n.createdAt.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    }));
  } catch (err) {
    return [];
  }
}

// -------------------------------------------------------
// MULTIMEDIA: Generar URL firmada para subida (R2)
// -------------------------------------------------------

export async function generateUploadUrl(
  token: string,
  fileName: string,
  mimeType: string
) {
  try {
    const proc = await prisma.process.findUnique({ where: { token } });
    if (!proc) return { success: false, error: "Proceso no encontrado." };

    const fileExt = fileName.split(".").pop() ?? "jpg";
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const r2Key = `${BASE_DIRECTORY}/${proc.r2Directory}/cliente/${uniqueId}.${fileExt}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      ContentType: mimeType,
    });

    const signedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    });

    return { success: true, signedUrl, r2Key };
  } catch (err: any) {
    console.error("Error generating upload URL:", err);
    return { success: false, error: err.message };
  }
}

export async function saveUploadRecord(
  token: string,
  data: {
    r2Key: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    isPaymentProof?: boolean;
  }
) {
  try {
    const proc = await prisma.process.findUnique({ where: { token } });
    if (!proc) return { success: false, error: "Proceso no encontrado." };

    await prisma.upload.create({
      data: {
        processId: proc.id,
        r2Key: data.r2Key,
        r2Bucket: BUCKET_NAME,
        fileName: data.fileName,
        fileType: "IMAGE",
        mimeType: data.mimeType,
        fileSizeBytes: data.fileSizeBytes,
        isPublic: false,
        isPaymentProof: data.isPaymentProof ?? false,
        uploadedBy: null, // null = subido por el cliente
      },
    });

    revalidatePath(`/proceso/${token}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error saving upload record:", err);
    return { success: false, error: err.message };
  }
}

// Admin: get signed URL for reading a file
export async function getSignedReadUrl(r2Key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
    });
    const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    return { success: true, url };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Admin: generate upload URL for payment proof
export async function generateAdminUploadUrl(
  processId: string,
  fileName: string,
  mimeType: string,
  r2Directory: string
) {
  try {
    const fileExt = fileName.split(".").pop() ?? "jpg";
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const r2Key = `${BASE_DIRECTORY}/${r2Directory}/admin/${uniqueId}.${fileExt}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      ContentType: mimeType,
    });

    const signedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    });

    return { success: true, signedUrl, r2Key };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveAdminUploadRecord(
  processId: string,
  data: {
    r2Key: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    isPaymentProof: boolean;
  }
) {
  try {
    await prisma.upload.create({
      data: {
        processId,
        r2Key: data.r2Key,
        r2Bucket: BUCKET_NAME,
        fileName: data.fileName,
        fileType: "IMAGE",
        mimeType: data.mimeType,
        fileSizeBytes: data.fileSizeBytes,
        isPublic: false,
        isPaymentProof: data.isPaymentProof,
        uploadedBy: "admin",
      },
    });

    revalidatePath(`/admin/procesos/${processId}`);
    revalidatePath(`/admin/procesos/${processId}/multimedia`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Admin: get all uploads for a process
export async function getProcessUploads(processId: string) {
  try {
    const uploads = await prisma.upload.findMany({
      where: { processId },
      orderBy: { createdAt: "desc" },
    });

    return uploads.map((u) => ({
      id: u.id,
      r2Key: u.r2Key,
      fileName: u.fileName,
      mimeType: u.mimeType,
      fileSizeBytes: u.fileSizeBytes,
      isPaymentProof: u.isPaymentProof,
      uploadedBy: u.uploadedBy ?? "cliente",
      createdAt: u.createdAt.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  } catch (err) {
    return [];
  }
}

// Client Form: save/update client form
export async function saveClientForm(
  token: string,
  data: {
    fullName: string;
    birthDate: string;
    fullName2?: string;
    birthDate2?: string;
    intention?: string;
    currentSituation?: string;
  }
) {
  try {
    const proc = await prisma.process.findUnique({ where: { token } });
    if (!proc) return { success: false, error: "Proceso no encontrado." };

    const bDate = data.birthDate ? new Date(data.birthDate) : null;
    const bDate2 = data.birthDate2 ? new Date(data.birthDate2) : null;
    const intentStr = data.intention || "Administrativo";
    const situationStr = data.currentSituation || "Administrativo";

    await prisma.clientForm.upsert({
      where: { processId: proc.id },
      update: {
        fullName: data.fullName,
        birthDate: bDate,
        fullName2: data.fullName2 || null,
        birthDate2: bDate2,
        intention: intentStr,
        currentSituation: situationStr,
      },
      create: {
        processId: proc.id,
        fullName: data.fullName,
        birthDate: bDate,
        fullName2: data.fullName2 || null,
        birthDate2: bDate2,
        intention: intentStr,
        currentSituation: situationStr,
      },
    });

    // Cambiar estado a PAYMENT_RECEIVED o PREPARATION para pokayoke si es necesario, 
    // pero por ahora solo guardamos el formulario y revalidamos.
    revalidatePath(`/proceso/${token}`);
    revalidatePath(`/admin/procesos/${proc.id}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error saving client form:", err);
    return { success: false, error: err.message || "Error al guardar el formulario." };
  }
}

// Client Form: get client form
export async function getClientForm(token: string) {
  try {
    const proc = await prisma.process.findUnique({
      where: { token },
      include: { clientForm: true },
    });
    if (!proc || !proc.clientForm) return null;

    return {
      fullName: proc.clientForm.fullName,
      birthDate: proc.clientForm.birthDate
        ? proc.clientForm.birthDate.toISOString().split("T")[0]
        : "",
      fullName2: proc.clientForm.fullName2 || "",
      birthDate2: proc.clientForm.birthDate2
        ? proc.clientForm.birthDate2.toISOString().split("T")[0]
        : "",
      intention: proc.clientForm.intention,
      currentSituation: proc.clientForm.currentSituation,
    };
  } catch (err) {
    console.error("Error fetching client form:", err);
    return null;
  }
}
