"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Activity,
  Trash2,
  User,
  DollarSign,
  Calendar,
  CheckCircle,
  FileText,
  ArrowUpRight,
  MessageCircle,
  Phone,
  ImageIcon,
  TrendingUp,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getProcessDetails, updateProcessStatus, deleteProcess, updateProcessAdminNotes, updateProcessPaymentInfo } from "@/app/admin/actions";
import { getEmotionalLogsByProcessId, getSignedReadUrl } from "@/app/proceso/actions";
import { ProcessStatus } from "@prisma/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProcessDetails {
  id: string;
  token: string;
  secureToken: string;
  workName: string;
  description: string | null;
  price: string;
  currency: string;
  status: ProcessStatus;
  priority: string;
  progressPercent: number;
  r2Directory: string;
  clientMessage: string | null;
  createdAtStr: string;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  adminNotes: string | null;
  pendingPaymentAmount: string | null;
  pendingPaymentDateStr: string | null;
  clientForm?: {
    id: string;
    fullName: string;
    birthDate: string | null;
    fullName2?: string | null;
    birthDate2?: string | null;
    intention: string;
    currentSituation: string;
    additionalInfo: string | null;
    submittedAt: string;
  } | null;
  uploads?: Array<{
    id: string;
    r2Key: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    isPaymentProof: boolean;
    uploadedBy: string | null;
    createdAt: string;
  }>;
  emotionalLogs?: Array<{
    id: string;
    type: string;
    content: string;
    mood: number | null;
    logDate: string;
  }>;
}

interface EmotionalLog {
  id: string;
  type: string;
  content: string;
  mood: number | null;
  logDate: string;
}

const statusLabels: Record<ProcessStatus, string> = {
  PENDING: "Pendiente",
  PAYMENT_RECEIVED: "Pago Recibido",
  PREPARATION: "Preparación",
  IN_PROGRESS: "En Proceso",
  SEALED: "Sellado",
  COMPLETED: "Completado",
  PAUSED: "Pausado",
  CANCELLED: "Cancelado",
};

function buildWhatsAppUrl(phone: string): string {
  const clean = phone.replace(/[\s\-\(\)]/g, "").replace(/^\+/, "");
  return `https://wa.me/${clean}`;
}

export default function AdminDetalleProcesoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [process, setProcess] = useState<ProcessDetails | null>(null);
  const [emotionalLogs, setEmotionalLogs] = useState<EmotionalLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<ProcessStatus>("PENDING");
  const [progressPercent, setProgressPercent] = useState(0);

  // Nuevos estados para la gestión de aportes del consultante
  const [activeClientTab, setActiveClientTab] = useState<"formulario" | "bitacora" | "archivos" | "impresion">("formulario");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Estados para notas, pagos e impresión
  const [adminNotes, setAdminNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [pendingAmount, setPendingAmount] = useState("");
  const [pendingDate, setPendingDate] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [printPerson, setPrintPerson] = useState<"persona1" | "persona2">("persona1");
  const [selectedPrintPhotoId, setSelectedPrintPhotoId] = useState<string>("");

  useEffect(() => {
    async function loadDetails() {
      setIsLoading(true);
      try {
        const data = await getProcessDetails(id);
        if (data) {
          setProcess(data as unknown as ProcessDetails);
          setStatus(data.status);
          setProgressPercent(data.progressPercent);
          setAdminNotes(data.adminNotes || "");
          setPendingAmount(data.pendingPaymentAmount || "");
          setPendingDate(data.pendingPaymentDateStr || "");
          // Cargar bitácoras en orden cronológico ascendente para el gráfico
          const logs = await getEmotionalLogsByProcessId(id);
          setEmotionalLogs(logs as EmotionalLog[]);
        } else {
          toast.error("No se encontró el proceso espiritual solicitado.");
          router.push("/admin/procesos");
        }
      } catch (err) {
        console.error("Error loading process details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDetails();
  }, [id, router]);

  // Cargar URLs firmadas para los archivos subidos por el cliente
  useEffect(() => {
    async function loadSignedUrls() {
      if (!process || !process.uploads) return;
      const clientFiles = process.uploads.filter(u => !u.uploadedBy || u.uploadedBy === "cliente");
      if (clientFiles.length === 0) return;
      
      const urlMap: Record<string, string> = {};
      for (const upload of clientFiles) {
        const res = await getSignedReadUrl(upload.r2Key);
        if (res.success && res.url) {
          urlMap[upload.id] = res.url;
        }
      }
      setSignedUrls(urlMap);
    }
    loadSignedUrls();
  }, [process]);

  // Canvas drawing effect for quick print preview
  useEffect(() => {
    if (!selectedPrintPhotoId || !process) return;
    const url = signedUrls[selectedPrintPhotoId];
    if (!url) return;

    const canvas = document.getElementById("print-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Draw background image cropped/centered perfectly
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);

      const imgRatio = img.width / img.height;
      const canvasRatio = cw / ch;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;

      if (imgRatio > canvasRatio) {
        sw = img.height * canvasRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / canvasRatio;
        sy = (img.height - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);

      // Gradient overlay at the bottom for readability
      const gradient = ctx.createLinearGradient(0, ch * 0.6, 0, ch);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(0.3, "rgba(0, 0, 0, 0.4)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.95)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, ch * 0.6, cw, ch - ch * 0.6);

      // Draw elegant white borders
      ctx.strokeStyle = "rgba(201, 168, 76, 0.35)"; // #C9A84C with opacity
      ctx.lineWidth = 14;
      ctx.strokeRect(0, 0, cw, ch);

      // Determine text content
      let name = "";
      let bDateStr = "";

      if (printPerson === "persona1") {
        name = process.clientForm?.fullName || process.client.name;
        bDateStr = process.clientForm?.birthDate
          ? new Date(process.clientForm.birthDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
          : "";
      } else {
        name = process.clientForm?.fullName2 || "";
        bDateStr = process.clientForm?.birthDate2
          ? new Date(process.clientForm.birthDate2).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
          : "";
      }

      // Draw Name in white
      ctx.fillStyle = "#F5F3EE";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      
      // Load professional serif font
      ctx.font = "bold 38px Georgia, 'Times New Roman', serif";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      
      const nameUpper = name.toUpperCase();
      ctx.fillText(nameUpper, cw / 2, ch - 120);

      // Draw Birth Date in elegant gold/white
      ctx.fillStyle = "#C9A84C";
      ctx.font = "italic 26px Georgia, 'Times New Roman', serif";
      ctx.shadowBlur = 4;
      ctx.fillText(bDateStr, cw / 2, ch - 65);
    };
    img.src = url;
  }, [selectedPrintPhotoId, printPerson, signedUrls, process]);

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      const res = await updateProcessStatus(id, status, progressPercent);
      if (res.success) {
        toast.success("¡Avance espiritual actualizado exitosamente!");
        if (process) {
          setProcess({ ...process, status, progressPercent });
        }
      } else {
        toast.error(res.error || "Ocurrió un error al guardar cambios.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de servidor.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás absolutamente seguro de eliminar permanentemente este proceso?")) return;
    setIsDeleting(true);
    try {
      const res = await deleteProcess(id);
      if (res.success) {
        toast.success("Proceso eliminado del Santuario.");
        router.push("/admin/procesos");
      } else {
        toast.error(res.error || "Error al eliminar.");
      }
    } catch (err) {
      toast.error("Error de servidor.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin" />
        <p className="text-[#9A9AB0] text-sm font-mono tracking-widest uppercase">Abriendo pergaminos...</p>
      </div>
    );
  }

  if (!process) return null;

  const chartData = emotionalLogs
    .filter((l) => l.mood !== null)
    .map((l) => ({
      fecha: l.logDate,
      estado: l.mood,
      comentario: l.content,
      tipo: l.type,
    }));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2A2A38] pb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/procesos">
            <Button variant="ghost" className="text-[#9A9AB0] hover:text-[#C9A84C] p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <span className="text-[10px] font-mono text-[#9A9AB0] uppercase tracking-widest">
              Ritual Ficha #{process.token.substring(0, 6).toUpperCase()}
            </span>
            <h1 className="text-2xl font-serif text-[#F5F3EE] mt-1">{process.workName}</h1>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/proceso/${process.token}`} target="_blank">
            <Button variant="outline" className="border-[#2A2A38] text-[#9A9AB0] hover:text-[#C9A84C] hover:bg-[#1A1A24]">
              Ver Portal Cliente <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            disabled={isDeleting}
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2"
          >
            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Gestión + Submódulos + Gráfica + Descripción */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card de Estado */}
          <div className="glass-panel p-6 rounded-2xl border border-[#2A2A38]">
            <h3 className="font-serif text-lg text-[#C9A84C] border-b border-[#2A2A38] pb-2 mb-6">
              Actualizar Estado y Avance
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Estado Ritualístico</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProcessStatus)}
                    className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-4 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12 cursor-pointer"
                  >
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">
                      Avance Interno (Admin)
                    </label>
                    <span className="text-[#C9A84C] font-mono text-sm font-semibold">{progressPercent}%</span>
                  </div>
                  <div className="flex items-center gap-4 h-12">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={progressPercent}
                      onChange={(e) => setProgressPercent(parseInt(e.target.value))}
                      className="w-full accent-[#C9A84C] cursor-pointer h-1.5 bg-[#1A1A24] rounded-lg appearance-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-[#2A2A38]">
                <Button
                  onClick={handleUpdateStatus}
                  disabled={isUpdating}
                  className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold"
                >
                  {isUpdating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Guardar Avance <Sparkles className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Submódulos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href={`/admin/procesos/${process.id}/timeline`}>
              <div className="glass-card p-5 rounded-2xl border border-[#2A2A38] hover:border-[#C9A84C]/30 text-center flex flex-col items-center justify-center space-y-2 transition-colors cursor-pointer group">
                <Activity className="w-5 h-5 text-[#9A9AB0] group-hover:text-[#C9A84C] transition-colors" />
                <span className="text-xs font-mono tracking-widest text-[#F5F3EE] uppercase">Timeline</span>
              </div>
            </Link>

            <Link href={`/admin/procesos/${process.id}/multimedia`}>
              <div className="glass-card p-5 rounded-2xl border border-[#2A2A38] hover:border-[#C9A84C]/30 text-center flex flex-col items-center justify-center space-y-2 transition-colors cursor-pointer group">
                <ImageIcon className="w-5 h-5 text-[#9A9AB0] group-hover:text-[#C9A84C] transition-colors" />
                <span className="text-xs font-mono tracking-widest text-[#F5F3EE] uppercase">Multimedia</span>
              </div>
            </Link>

            <div className="glass-card p-5 rounded-2xl border border-[#2A2A38] opacity-50 text-center flex flex-col items-center justify-center space-y-2">
              <CheckCircle className="w-5 h-5 text-[#9A9AB0]" />
              <span className="text-xs font-mono tracking-widest text-[#F5F3EE] uppercase">Encuestas</span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-[#2A2A38] opacity-50 text-center flex flex-col items-center justify-center space-y-2">
              <FileText className="w-5 h-5 text-[#9A9AB0]" />
              <span className="text-xs font-mono tracking-widest text-[#F5F3EE] uppercase">Notas</span>
            </div>
          </div>

          {/* Gráfica emocional del cliente */}
          <div className="glass-panel p-6 rounded-2xl border border-[#2A2A38]">
            <div className="flex items-center gap-2 border-b border-[#2A2A38] pb-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#C9A84C]" />
              <h3 className="font-serif text-lg text-[#F5F3EE]">Estado Emocional del Consultante</h3>
            </div>

            {chartData.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#C9A84C]/5 border border-[#C9A84C]/10 flex items-center justify-center mx-auto">
                  <Activity className="w-5 h-5 text-[#9A9AB0]/40" />
                </div>
                <p className="text-[#9A9AB0] text-sm">
                  El consultante aún no ha registrado su bitácora emocional.
                </p>
              </div>
            ) : (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fill: "#9A9AB0", fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: "#2A2A38" }}
                    />
                    <YAxis
                      domain={[1, 10]}
                      tick={{ fill: "#9A9AB0", fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: "#2A2A38" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const moodEmojis = ["😔", "😟", "😕", "😐", "🙂", "😊", "😌", "✨", "🌟", "🌈"];
                          const emoji = data.estado && data.estado >= 1 && data.estado <= 10 ? moodEmojis[data.estado - 1] : "✨";
                          return (
                            <div className="bg-[#0A0A0F] border border-[#2A2A38] rounded-xl p-3 max-w-[280px] text-xs space-y-1.5 shadow-xl text-left">
                              <p className="text-[#9A9AB0] font-mono text-[9px] uppercase tracking-wider">{data.fecha}</p>
                              <p className="text-[#C9A84C] font-semibold flex items-center gap-1.5">
                                <span className="text-sm">{emoji}</span> Estado: {data.estado}/10
                              </p>
                              {data.comentario && (
                                <p className="text-[#F5F3EE]/95 leading-relaxed italic border-t border-[#2A2A38] pt-1.5 mt-1.5 whitespace-pre-wrap">
                                  "{data.comentario}"
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                      trigger="click"
                    />
                    <Line
                      type="monotone"
                      dataKey="estado"
                      stroke="#C9A84C"
                      strokeWidth={2}
                      dot={{ fill: "#C9A84C", strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: "#F0D080" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Anotaciones Privadas (Editor) */}
          <div className="glass-panel p-6 rounded-2xl border border-[#C9A84C]/20 relative overflow-hidden">
            <h3 className="font-serif text-lg text-[#C9A84C] border-b border-[#2A2A38] pb-2 mb-4 flex items-center justify-between">
              <span>Anotaciones y Referencias Privadas</span>
              <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-full">Exclusivo Admin</span>
            </h3>
            <div className="space-y-4">
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Escribe aquí referencias del cliente, números de contacto alternativos, promesas especiales, detalles de preparación o cualquier nota que solo tú debas ver..."
                className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl p-4 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors min-h-[140px] resize-none leading-relaxed"
              />
              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    setIsSavingNotes(true);
                    const res = await updateProcessAdminNotes(id, adminNotes);
                    if (res.success) {
                      toast.success("¡Notas administrativas guardadas!");
                    } else {
                      toast.error(res.error || "Error al guardar notas.");
                    }
                    setIsSavingNotes(false);
                  }}
                  disabled={isSavingNotes}
                  className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold text-xs py-1.5 h-9 rounded-xl"
                >
                  {isSavingNotes ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Guardar Notas Privadas"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Aportes del Consultante */}
          <div className="glass-panel p-6 rounded-2xl border border-[#2A2A38] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2A2A38] pb-3 gap-2">
              <h3 className="font-serif text-lg text-[#C9A84C] flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Información y Aportes del Consultante
              </h3>
              
              {/* Pestañas de control */}
              <div className="flex bg-[#0A0A0F] p-1 rounded-xl border border-[#2A2A38] w-fit">
                {(["formulario", "bitacora", "archivos", "impresion"] as const).map((tab) => {
                  const labels = {
                    formulario: "Formulario",
                    bitacora: "Bitácora",
                    archivos: "Archivos",
                    impresion: "Impresión Rápida"
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveClientTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                        activeClientTab === tab
                          ? "bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20"
                          : "text-[#9A9AB0] hover:text-[#F5F3EE]"
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contenido Pestaña: Formulario */}
            {activeClientTab === "formulario" && (
              <div className="space-y-4">
                {process.clientForm ? (
                  <div className="space-y-6 text-sm text-left">
                    
                    {/* Persona 1 */}
                    <div className="p-4 rounded-xl border border-[#2A2A38]/50 bg-[#0A0A0F]/30 space-y-3">
                      <p className="text-[10px] font-mono text-[#C9A84C] uppercase tracking-wider">Persona 1 (Principal)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-[#9A9AB0] block uppercase font-mono tracking-wider">Nombre de Nacimiento</span>
                          <span className="text-[#F5F3EE] font-medium block mt-0.5">{process.clientForm.fullName}</span>
                        </div>
                        <div>
                          <span className="text-xs text-[#9A9AB0] block uppercase font-mono tracking-wider">Fecha de Nacimiento</span>
                          <span className="text-[#F5F3EE] font-medium block mt-0.5">
                            {process.clientForm.birthDate 
                              ? new Date(process.clientForm.birthDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) 
                              : "No provista"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Persona 2 */}
                    {process.clientForm.fullName2 && (
                      <div className="p-4 rounded-xl border border-[#2A2A38]/50 bg-[#0A0A0F]/30 space-y-3">
                        <p className="text-[10px] font-mono text-[#C9A84C] uppercase tracking-wider">Persona 2</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-[#9A9AB0] block uppercase font-mono tracking-wider">Nombre de Nacimiento</span>
                            <span className="text-[#F5F3EE] font-medium block mt-0.5">{process.clientForm.fullName2}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[#9A9AB0] block uppercase font-mono tracking-wider">Fecha de Nacimiento</span>
                            <span className="text-[#F5F3EE] font-medium block mt-0.5">
                              {process.clientForm.birthDate2 
                                ? new Date(process.clientForm.birthDate2).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) 
                                : "No provista"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {process.clientForm.intention && process.clientForm.intention !== "Administrativo" && (
                      <div className="border-t border-[#2A2A38] pt-3">
                        <span className="text-xs text-[#9A9AB0] block uppercase font-mono tracking-wider">Intención del Proceso</span>
                        <p className="text-sm text-[#F5F3EE]/95 mt-1.5 whitespace-pre-wrap leading-relaxed bg-[#0A0A0F]/50 p-3.5 rounded-xl border border-[#2A2A38]/30">
                          {process.clientForm.intention}
                        </p>
                      </div>
                    )}

                    {process.clientForm.currentSituation && process.clientForm.currentSituation !== "Administrativo" && (
                      <div className="border-t border-[#2A2A38] pt-3">
                        <span className="text-xs text-[#9A9AB0] block uppercase font-mono tracking-wider">Situación Actual</span>
                        <p className="text-sm text-[#F5F3EE]/95 mt-1.5 whitespace-pre-wrap leading-relaxed bg-[#0A0A0F]/50 p-3.5 rounded-xl border border-[#2A2A38]/30">
                          {process.clientForm.currentSituation}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[#9A9AB0] text-sm py-4 text-center">El consultante aún no ha completado el formulario de conexión inicial.</p>
                )}
              </div>
            )}

            {/* Contenido Pestaña: Bitácora */}
            {activeClientTab === "bitacora" && (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {process.emotionalLogs && process.emotionalLogs.length > 0 ? (
                  process.emotionalLogs.map((log) => {
                    const moodEmojis = ["😔", "😟", "😕", "😐", "🙂", "😊", "😌", "✨", "🌟", "🌈"];
                    const emoji = log.mood ? moodEmojis[log.mood - 1] : "✨";
                    const logTypes = {
                      emocion: { label: "Emoción", color: "text-pink-400" },
                      sueno: { label: "Sueño", color: "text-purple-400" },
                      cambio: { label: "Cambio Percibido", color: "text-amber-400" },
                      experiencia: { label: "Experiencia Espiritual", color: "text-emerald-400" },
                      pensamiento: { label: "Reflexión", color: "text-blue-400" }
                    };
                    const typeInfo = logTypes[log.type as keyof typeof logTypes] || { label: "Registro", color: "text-[#9A9AB0]" };
                    
                    return (
                      <div key={log.id} className="p-3 bg-[#0A0A0F]/30 border border-[#2A2A38] rounded-xl space-y-1.5 text-left">
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-mono uppercase tracking-wider text-[10px] ${typeInfo.color} font-semibold`}>
                            {typeInfo.label} {log.mood && `• ${emoji} (${log.mood}/10)`}
                          </span>
                          <span className="text-[#9A9AB0] text-[10px]">
                            {new Date(log.logDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-[#F5F3EE] leading-relaxed italic bg-[#0A0A0F]/20 p-2 rounded-lg border border-[#2A2A38]/10">
                          "{log.content}"
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[#9A9AB0] text-sm py-4 text-center">El consultante no ha registrado entradas en su bitácora aún.</p>
                )}
              </div>
            )}

            {/* Contenido Pestaña: Archivos */}
            {activeClientTab === "archivos" && (
              <div className="space-y-4">
                {process.uploads && process.uploads.filter(u => !u.uploadedBy || u.uploadedBy === "cliente").length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {process.uploads
                      .filter(u => !u.uploadedBy || u.uploadedBy === "cliente")
                      .map((u) => {
                        const isHeic = u.fileName.toLowerCase().endsWith(".heic") || u.fileName.toLowerCase().endsWith(".heif");
                        const isPdf = u.fileName.toLowerCase().endsWith(".pdf");
                        const url = signedUrls[u.id];
                        return (
                          <div key={u.id} className="bg-[#0A0A0F]/40 border border-[#2A2A38] rounded-xl p-2 flex flex-col space-y-2 relative overflow-hidden group text-left">
                            {url ? (
                              <div className="aspect-square relative rounded-lg overflow-hidden bg-[#111118] flex items-center justify-center border border-[#2A2A38]/40">
                                {isHeic ? (
                                  <div className="flex flex-col items-center justify-center p-2 text-center">
                                    <ImageIcon className="w-6 h-6 text-[#C9A84C]" />
                                    <span className="text-[8px] font-mono text-[#9A9AB0] uppercase mt-1">HEIC</span>
                                  </div>
                                ) : isPdf ? (
                                  <div className="flex flex-col items-center justify-center p-2 text-center">
                                    <FileText className="w-6 h-6 text-red-400" />
                                    <span className="text-[8px] font-mono text-[#9A9AB0] uppercase mt-1">PDF</span>
                                  </div>
                                ) : (
                                  <img src={url} alt={u.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                )}
                                <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-[#0A0A0F]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <span className="text-[10px] font-mono text-[#C9A84C] border border-[#C9A84C]/50 px-2 py-1 rounded bg-[#0A0A0F]">Ver archivo</span>
                                </a>
                              </div>
                            ) : (
                              <div className="aspect-square bg-[#111118] rounded-lg flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-[#C9A84C]/40 animate-spin" />
                              </div>
                            )}
                            <div className="text-[10px] truncate font-medium text-[#F5F3EE]">{u.fileName}</div>
                            <div className="text-[9px] text-[#9A9AB0]/60 font-mono flex justify-between">
                              <span>{u.isPaymentProof ? "Comprobante" : "Imagen"}</span>
                              <span>{(u.fileSizeBytes / 1024).toFixed(0)} KB</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-[#9A9AB0] text-sm py-4 text-center">El consultante no ha subido imágenes o archivos aún.</p>
                )}
              </div>
            )}

            {/* Contenido Pestaña: Impresión Rápida */}
            {activeClientTab === "impresion" && (
              <div className="space-y-6">
                <div className="text-left space-y-2">
                  <p className="text-xs text-[#9A9AB0]">
                    Genera y descarga fichas espirituales premium o imprímelas con un diseño limpio. Selecciona una foto de la galería del cliente, elige los datos de la persona a imprimir, y genera la tarjeta profesional.
                  </p>
                </div>

                {/* Grid de selección */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Columna Izquierda: Selección de Foto y Persona */}
                  <div className="space-y-4 md:col-span-1 text-left">
                    {/* Selector de Persona */}
                    <div className="space-y-1.5">
                      <label className="text-[#9A9AB0] text-[10px] font-mono tracking-widest uppercase">Persona a Imprimir</label>
                      <select
                        value={printPerson}
                        onChange={(e) => setPrintPerson(e.target.value as "persona1" | "persona2")}
                        className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-10 cursor-pointer"
                      >
                        <option value="persona1">
                          Persona 1: {process.clientForm?.fullName || process.client.name}
                        </option>
                        {process.clientForm?.fullName2 && (
                          <option value="persona2">
                            Persona 2: {process.clientForm.fullName2}
                          </option>
                        )}
                      </select>
                    </div>

                    {/* Selector de Foto */}
                    <div className="space-y-1.5">
                      <label className="text-[#9A9AB0] text-[10px] font-mono tracking-widest uppercase">Seleccionar Foto</label>
                      {process.uploads && process.uploads.filter(u => !u.uploadedBy || u.uploadedBy === "cliente").length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-[#2A2A38] p-2 rounded-xl bg-[#0A0A0F]/30">
                          {process.uploads
                            .filter(u => !u.uploadedBy || u.uploadedBy === "cliente")
                            .map((u) => {
                              const url = signedUrls[u.id];
                              const isSelected = selectedPrintPhotoId === u.id;
                              return (
                                <div
                                  key={u.id}
                                  onClick={() => setSelectedPrintPhotoId(u.id)}
                                  className={`aspect-square rounded-lg overflow-hidden border cursor-pointer relative group ${
                                    isSelected ? "border-[#C9A84C] ring-1 ring-[#C9A84C]" : "border-[#2A2A38] hover:border-[#C9A84C]/50"
                                  }`}
                                >
                                  {url ? (
                                    <img src={url} alt={u.fileName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-[#111118] flex items-center justify-center">
                                      <Loader2 className="w-4 h-4 text-[#C9A84C]/40 animate-spin" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#9A9AB0] italic bg-[#0A0A0F]/20 p-3 rounded-xl border border-[#2A2A38]/30">
                          No hay fotos subidas por el cliente.
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="pt-2 space-y-2">
                      <Button
                        onClick={() => {
                          const canvas = document.getElementById("print-canvas") as HTMLCanvasElement;
                          if (!canvas) return;
                          const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
                          const link = document.createElement("a");
                          link.download = `ficha_${(printPerson === "persona1" ? process.clientForm?.fullName : process.clientForm?.fullName2) || "ritual"}.jpg`;
                          link.href = dataUrl;
                          link.click();
                          toast.success("¡Imagen de la ficha descargada con éxito!");
                        }}
                        disabled={!selectedPrintPhotoId}
                        className="w-full bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold text-xs py-2 rounded-xl h-10 flex items-center justify-center gap-1.5"
                      >
                        Descargar Ficha (JPG)
                      </Button>

                      <Button
                        onClick={() => {
                          window.print();
                        }}
                        disabled={!selectedPrintPhotoId}
                        variant="outline"
                        className="w-full border-[#2A2A38] text-[#9A9AB0] hover:text-[#C9A84C] hover:bg-[#1A1A24] font-semibold text-xs py-2 rounded-xl h-10 flex items-center justify-center gap-1.5"
                      >
                        Imprimir Ficha
                      </Button>
                    </div>
                  </div>

                  {/* Columna Derecha: Vista Previa y Canvas */}
                  <div className="md:col-span-2 flex flex-col items-center justify-center border border-[#2A2A38] p-4 rounded-2xl bg-[#0A0A0F]/20 relative min-h-[300px]">
                    <p className="text-[10px] font-mono text-[#9A9AB0] uppercase tracking-wider mb-2 self-start">Vista Previa de la Ficha</p>
                    
                    {selectedPrintPhotoId ? (
                      <div className="relative border border-[#C9A84C]/30 rounded-2xl overflow-hidden shadow-2xl bg-black max-w-[280px] w-full aspect-[4/5] flex items-center justify-center">
                        <canvas
                          id="print-canvas"
                          className="w-full h-full object-contain"
                          width={800}
                          height={1000}
                        />
                        {/* CSS Print Specific Overlay */}
                        <div className="print-only-element">
                          <img
                            src={signedUrls[selectedPrintPhotoId]}
                            alt="Ficha"
                            className="w-full h-full object-cover"
                          />
                          <div className="print-overlay-text">
                            <h2 className="print-name">
                              {printPerson === "persona1"
                                ? process.clientForm?.fullName
                                : process.clientForm?.fullName2}
                            </h2>
                            <p className="print-date">
                              {printPerson === "persona1"
                                ? process.clientForm?.birthDate
                                  ? new Date(process.clientForm.birthDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
                                  : ""
                                : process.clientForm?.birthDate2
                                ? new Date(process.clientForm.birthDate2).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2 text-[#9A9AB0]">
                        <ImageIcon className="w-12 h-12 opacity-30" />
                        <p className="text-xs">Selecciona una foto para ver la Ficha Espiritual Premium</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CSS para la impresión */}
                <style>{`
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    .print-only-element, .print-only-element * {
                      visibility: visible;
                    }
                    .print-only-element {
                      position: fixed;
                      left: 50%;
                      top: 50%;
                      transform: translate(-50%, -50%);
                      width: 500px;
                      height: 625px;
                      border-radius: 20px;
                      overflow: hidden;
                      box-shadow: none;
                      background-color: black;
                      border: 1px solid #C9A84C;
                    }
                    .print-overlay-text {
                      position: absolute;
                      bottom: 0;
                      left: 0;
                      width: 100%;
                      padding: 24px;
                      background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0));
                      color: white;
                      text-align: center;
                      font-family: serif;
                    }
                    .print-name {
                      font-size: 24px;
                      font-weight: 600;
                      letter-spacing: 0.05em;
                      text-transform: uppercase;
                      margin-bottom: 6px;
                      color: #F5F3EE;
                    }
                    .print-date {
                      font-size: 16px;
                      color: #C9A84C;
                      font-family: monospace;
                      letter-spacing: 0.1em;
                    }
                  }
                  .print-only-element {
                    display: none;
                  }
                  @media print {
                    .print-only-element {
                      display: block;
                    }
                  }
                `}</style>
              </div>
            )}
          </div>
        </div>

        {/* Right: Ficha del Cliente + Info General */}
        <div className="space-y-6">

          {/* Consultante */}
          <div className="glass-panel p-6 rounded-2xl border border-[#2A2A38] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#3D2B6B] rounded-full blur-[40px] opacity-20" />

            <h3 className="font-serif text-lg text-[#C9A84C] border-b border-[#2A2A38] pb-2 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2" /> Consultante
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-[#9A9AB0] block uppercase font-mono tracking-wider">Nombre Completo</span>
                <span className="text-[#F5F3EE] font-medium block">{process.client.name}</span>
              </div>

              {process.client.email && (
                <div>
                  <span className="text-xs text-[#9A9AB0] block uppercase font-mono tracking-wider">Correo Electrónico</span>
                  <span className="text-[#F5F3EE] block font-mono text-xs">{process.client.email}</span>
                </div>
              )}

              {process.client.phone && (
                <div>
                  <span className="text-xs text-[#9A9AB0] block uppercase font-mono tracking-wider mb-1">
                    Teléfono / WhatsApp
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#F5F3EE] block font-mono text-xs">{process.client.phone}</span>
                    <a
                      href={buildWhatsAppUrl(process.client.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Abrir en WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono">WA</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información General */}
          <div className="glass-panel p-6 rounded-2xl border border-[#2A2A38]">
            <h3 className="font-serif text-lg text-[#F5F3EE] border-b border-[#2A2A38] pb-2 mb-4 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" /> Información General
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-[#2A2A38] pb-2">
                <span className="text-[#9A9AB0] font-mono text-xs uppercase">Precio / Ofrenda</span>
                <span className="text-[#F5F3EE] font-semibold font-mono">{process.price} {process.currency}</span>
              </div>
              <div className="flex justify-between border-b border-[#2A2A38] pb-2">
                <span className="text-[#9A9AB0] font-mono text-xs uppercase">Prioridad</span>
                <span className="text-[#C9A84C] font-semibold uppercase text-xs">{process.priority}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#9A9AB0] font-mono text-xs uppercase">Fecha Registro</span>
                <span className="text-[#F5F3EE] text-xs font-mono">{process.createdAtStr}</span>
              </div>
            </div>
          </div>

          {/* Gestión de Saldos y Pagos */}
          <div className="glass-panel p-6 rounded-2xl border border-[#2A2A38] space-y-4">
            <h3 className="font-serif text-lg text-[#C9A84C] border-b border-[#2A2A38] pb-2 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" /> Gestión de Saldos
            </h3>
            
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[#9A9AB0] text-[10px] font-mono tracking-widest uppercase">Pago Pendiente (Monto)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#9A9AB0]/60 font-mono font-semibold">$</span>
                  <input
                    type="number"
                    value={pendingAmount}
                    onChange={(e) => setPendingAmount(e.target.value)}
                    placeholder="Monto pendiente (Ej. 500)"
                    className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl pl-8 pr-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-10 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#9A9AB0] text-[10px] font-mono tracking-widest uppercase">Fecha Compromiso de Pago</label>
                <input
                  type="date"
                  value={pendingDate}
                  onChange={(e) => setPendingDate(e.target.value)}
                  className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-10 [color-scheme:dark]"
                />
                <span className="text-[9px] text-[#9A9AB0]/60 italic font-mono block">Solo visible para el administrador.</span>
              </div>

              <Button
                onClick={async () => {
                  setIsSavingPayment(true);
                  const amt = pendingAmount ? parseFloat(pendingAmount) : null;
                  const res = await updateProcessPaymentInfo(id, amt, pendingDate || null);
                  if (res.success) {
                    toast.success("¡Información de saldos guardada!");
                  } else {
                    toast.error(res.error || "Error al guardar pagos.");
                  }
                  setIsSavingPayment(false);
                }}
                disabled={isSavingPayment}
                className="w-full bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/25 hover:bg-[#C9A84C]/20 font-semibold text-xs py-2 rounded-xl h-10 mt-2 flex items-center justify-center gap-1.5"
              >
                {isSavingPayment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Guardar Saldos"
                )}
              </Button>
            </div>
          </div>

          {/* Enlace cliente */}
          <div className="glass-panel p-4 rounded-2xl border border-[#2A2A38] space-y-2">
            <p className="text-[#9A9AB0] text-xs font-mono uppercase tracking-widest">Token del cliente</p>
            <p className="text-[#C9A84C] font-mono text-xs break-all">{process.token}</p>
            <Link href={`/proceso/${process.token}`} target="_blank">
              <Button variant="outline" className="w-full border-[#2A2A38] text-[#9A9AB0] hover:text-[#C9A84C] hover:bg-[#1A1A24] text-xs mt-2">
                Abrir portal del cliente <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
