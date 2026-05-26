"use server";

import prisma from "@/lib/prisma";
import { generateProcessTokens } from "@/lib/crypto/tokens";
import { ProcessStatus, Priority } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";

async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("aura_admin_session")?.value;
  if (!token) throw new Error("No autorizado");
  const payload = await verifyToken(token);
  if (!payload) throw new Error("Sesión inválida");
  return payload;
}

// ----------------------------------------------------
// DASHBOARD & STATS ACTIONS
// ----------------------------------------------------

export async function getDashboardStats() {
  try {
    await verifyAdminSession();
    // 1. Procesos Activos (todos menos COMPLETED y CANCELLED)
    const activeCount = await prisma.process.count({
      where: {
        NOT: [
          { status: ProcessStatus.COMPLETED },
          { status: ProcessStatus.CANCELLED }
        ]
      }
    });

    // 2. Procesos Finalizados (COMPLETED)
    const completedCount = await prisma.process.count({
      where: {
        status: ProcessStatus.COMPLETED
      }
    });

    // 3. Clientes Totales
    const clientsCount = await prisma.client.count();

    // 4. Alertas (Notificaciones no leídas)
    const alertsCount = await prisma.notification.count({
      where: {
        isRead: false
      }
    });

    // 5. Actividad Reciente (últimos 5 procesos creados)
    const recentProcesses = await prisma.process.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 5,
      include: {
        client: true
      }
    });

    // 6. Seguimiento Rápido (últimos 3 procesos activos)
    const quickFollowups = await prisma.process.findMany({
      where: {
        NOT: [
          { status: ProcessStatus.COMPLETED },
          { status: ProcessStatus.CANCELLED }
        ]
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 3,
      include: {
        client: true
      }
    });

    return {
      activeCount,
      completedCount,
      clientsCount,
      alertsCount,
      recentProcesses: recentProcesses.map(p => ({
        id: p.id,
        workName: p.workName,
        clientName: p.client.name,
        status: p.status,
        createdAt: p.createdAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      })),
      quickFollowups: quickFollowups.map(p => ({
        id: p.id,
        workName: p.workName,
        clientName: p.client.name,
        status: p.status,
        progressPercent: p.progressPercent
      }))
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      activeCount: 0,
      completedCount: 0,
      clientsCount: 0,
      alertsCount: 0,
      recentProcesses: [],
      quickFollowups: []
    };
  }
}

// ----------------------------------------------------
// PROCESS ACTIONS
// ----------------------------------------------------

export async function getProcesses(search?: string, status?: string) {
  try {
    await verifyAdminSession();
    const whereClause: any = {};

    if (status) {
      whereClause.status = status as ProcessStatus;
    }

    if (search) {
      whereClause.OR = [
        { workName: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } }
      ];
    }

    const list = await prisma.process.findMany({
      where: whereClause,
      include: {
        client: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return list.map(p => ({
      id: p.id,
      token: p.token,
      workName: p.workName,
      clientName: p.client.name,
      status: p.status,
      priority: p.priority,
      progressPercent: p.progressPercent,
      createdAt: p.createdAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    }));
  } catch (error) {
    console.error("Error fetching processes:", error);
    return [];
  }
}

export async function getProcessDetails(id: string) {
  try {
    await verifyAdminSession();
    const proc = await prisma.process.findUnique({
      where: { id },
      include: {
        client: true,
        updates: {
          orderBy: { createdAt: "desc" }
        },
        notes: {
          orderBy: { createdAt: "desc" }
        },
        clientForm: true,
        uploads: {
          orderBy: { createdAt: "desc" }
        },
        emotionalLogs: {
          orderBy: { logDate: "desc" }
        },
        ritualizations: {
          orderBy: { orderIndex: "asc" }
        }
      }
    });

    if (!proc) return null;

    return {
      ...proc,
      price: proc.price.toString(),
      pendingPaymentAmount: proc.pendingPaymentAmount?.toString() || null,
      pendingPaymentDateStr: proc.pendingPaymentDate ? proc.pendingPaymentDate.toISOString().split("T")[0] : null,
      clientLastSeenStr: proc.clientLastSeen ? proc.clientLastSeen.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null,
      createdAtStr: proc.createdAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    };
  } catch (error) {
    console.error("Error fetching process details:", error);
    return null;
  }
}

export async function createProcess(formData: {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientBirthDate?: string;   // YYYY-MM-DD - fecha de nacimiento del consultante
  clientBirthDate2?: string;  // segunda persona (opcional)
  clientFullName2?: string;   // segunda persona nombre (opcional)
  workName: string;
  description?: string;
  price: number;
  currency: string;
  status: ProcessStatus;
  priority: Priority;
  estimatedDays?: number;
  clientMessage?: string;
}) {
  try {
    await verifyAdminSession();
    // 1. Crear o buscar Cliente
    let client = await prisma.client.findFirst({
      where: {
        name: formData.clientName,
        email: formData.clientEmail || undefined
      }
    });

    const birthDateObj = formData.clientBirthDate ? new Date(formData.clientBirthDate) : null;

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: formData.clientName,
          email: formData.clientEmail || null,
          phone: formData.clientPhone || null,
          birthDate: birthDateObj,
        }
      });
    } else if (birthDateObj && !client.birthDate) {
      // Actualizar fecha de nacimiento si no la tenía
      client = await prisma.client.update({
        where: { id: client.id },
        data: { birthDate: birthDateObj }
      });
    }

    // 2. Generar tokens seguros
    const tokens = generateProcessTokens();

    // 3. Crear el proceso en la base de datos
    const newProcess = await prisma.process.create({
      data: {
        token: tokens.token,
        secureToken: tokens.secureToken,
        r2Directory: tokens.r2Directory,
        clientId: client.id,
        workName: formData.workName,
        description: formData.description || null,
        price: formData.price,
        currency: formData.currency,
        status: formData.status,
        priority: formData.priority,
        estimatedDays: formData.estimatedDays || null,
        clientMessage: formData.clientMessage || null,
      }
    });

    // 4. Si el admin proveyó fecha de nacimiento, pre-crear ClientForm para omitir el poka-yoke de datos personales
    if (formData.clientBirthDate) {
      await prisma.clientForm.create({
        data: {
          processId: newProcess.id,
          fullName: formData.clientName,
          birthDate: birthDateObj,
          fullName2: formData.clientFullName2 || null,
          birthDate2: formData.clientBirthDate2 ? new Date(formData.clientBirthDate2) : null,
          intention: "Administrativo",
          currentSituation: "Administrativo",
        }
      });
    }

    // 5. Log de actividad
    await prisma.activityLog.create({
      data: {
        action: "CREATE_PROCESS",
        entity: "process",
        entityId: newProcess.id,
        metadata: JSON.stringify({ workName: formData.workName, clientName: formData.clientName })
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/procesos");

    return { success: true, process: newProcess };
  } catch (error: any) {
    console.error("Error creating process:", error);
    return { success: false, error: error.message || "Error al crear el proceso" };
  }
}

export async function updateProcessStatus(id: string, status: ProcessStatus, progressPercent: number) {
  try {
    await verifyAdminSession();
    const updated = await prisma.process.update({
      where: { id },
      data: { 
        status,
        progressPercent
      }
    });

    // Añadir log de actividad
    await prisma.activityLog.create({
      data: {
        action: `UPDATE_STATUS_${status}`,
        entity: "process",
        entityId: id,
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/procesos");
    revalidatePath(`/admin/procesos/${id}`);

    return { success: true, process: updated };
  } catch (error: any) {
    console.error("Error updating status:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteProcess(id: string) {
  try {
    await verifyAdminSession();
    await prisma.process.delete({
      where: { id }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/procesos");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting process:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProcessAdminNotes(id: string, adminNotes: string) {
  try {
    await verifyAdminSession();
    await prisma.process.update({
      where: { id },
      data: { adminNotes }
    });
    revalidatePath(`/admin/procesos/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating admin notes:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProcessDescription(id: string, description: string) {
  try {
    await verifyAdminSession();
    await prisma.process.update({
      where: { id },
      data: { description }
    });
    revalidatePath(`/admin/procesos/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating process description:", error);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// RITUALIZATION ACTIONS
// ----------------------------------------------------

export async function getRitualizations(processId: string) {
  try {
    await verifyAdminSession();
    const list = await prisma.ritualization.findMany({
      where: { processId },
      orderBy: { orderIndex: "asc" }
    });
    return list;
  } catch (error) {
    console.error("Error fetching ritualizations:", error);
    return [];
  }
}

export async function createRitualization(processId: string, name: string, notes?: string) {
  try {
    await verifyAdminSession();
    const count = await prisma.ritualization.count({ where: { processId } });
    const ritual = await prisma.ritualization.create({
      data: {
        processId,
        name,
        notes: notes || null,
        orderIndex: count,
      }
    });
    revalidatePath(`/admin/procesos/${processId}`);
    return { success: true, ritual };
  } catch (error: any) {
    console.error("Error creating ritualization:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleRitualization(id: string, processId: string, isCompleted: boolean) {
  try {
    await verifyAdminSession();
    await prisma.ritualization.update({
      where: { id },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    });
    revalidatePath(`/admin/procesos/${processId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling ritualization:", error);
    return { success: false, error: error.message };
  }
}

export async function updateRitualizationNotes(id: string, processId: string, notes: string) {
  try {
    await verifyAdminSession();
    await prisma.ritualization.update({
      where: { id },
      data: { notes }
    });
    revalidatePath(`/admin/procesos/${processId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteRitualization(id: string, processId: string) {
  try {
    await verifyAdminSession();
    await prisma.ritualization.delete({ where: { id } });
    revalidatePath(`/admin/procesos/${processId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting ritualization:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProcessPaymentInfo(
  id: string,
  amount: number | null,
  dateStr: string | null
) {
  try {
    await verifyAdminSession();
    const pDate = dateStr ? new Date(dateStr) : null;
    await prisma.process.update({
      where: { id },
      data: {
        pendingPaymentAmount: amount,
        pendingPaymentDate: pDate
      }
    });
    revalidatePath(`/admin/procesos/${id}`);
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating payment info:", error);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// CLIENT ACTIONS
// ----------------------------------------------------

export async function getClients() {
  try {
    await verifyAdminSession();
    const list = await prisma.client.findMany({
      include: {
        _count: {
          select: { processes: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return list.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      processesCount: c._count.processes,
      createdAt: c.createdAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    }));
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

// ----------------------------------------------------
// WORKER ACTIONS
// ----------------------------------------------------

export async function getWorkers() {
  try {
    await verifyAdminSession();
    const list = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return list.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      lastLogin: u.lastLogin ? u.lastLogin.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Nunca"
    }));
  } catch (error) {
    console.error("Error fetching workers:", error);
    return [];
  }
}
