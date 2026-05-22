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
  Lock, 
  User, 
  DollarSign, 
  Calendar,
  CheckCircle,
  FileText,
  Clock,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getProcessDetails, updateProcessStatus, deleteProcess } from "@/app/admin/actions";
import { ProcessStatus } from "@prisma/client";

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
  estimatedDays: number | null;
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
}

export default function AdminDetalleProcesoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [process, setProcess] = useState<ProcessDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Editable fields local states
  const [status, setStatus] = useState<ProcessStatus>("PENDING");
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    async function loadDetails() {
      setIsLoading(true);
      try {
        const data = await getProcessDetails(id);
        if (data) {
          setProcess(data as unknown as ProcessDetails);
          setStatus(data.status);
          setProgressPercent(data.progressPercent);
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
    if (!confirm("¿Estás absolutamente seguro de eliminar permanentemente este proceso y todas sus bitácoras de la base de datos?")) {
      return;
    }
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
      console.error(err);
      toast.error("Error de servidor.");
    } finally {
      setIsDeleting(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin" />
        <p className="text-[#9A9AB0] text-sm font-mono tracking-widest uppercase">Abriendo pergaminos...</p>
      </div>
    );
  }

  if (!process) return null;

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
            <span className="text-[10px] font-mono text-[#9A9AB0] uppercase tracking-widest">Ritual Ficha #{process.token.substring(0, 6).toUpperCase()}</span>
            <h1 className="text-2xl font-serif text-[#F5F3EE] mt-1">{process.workName}</h1>
          </div>
        </div>

        <div className="flex gap-2">
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
        
        {/* Lado Izquierdo: Gestión de Estados y Progreso */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card de Estado del Trabajo */}
          <div className="glass-panel p-6 rounded-2xl border border-[#2A2A38]">
            <h3 className="font-serif text-lg text-[#C9A84C] border-b border-[#2A2A38] pb-2 mb-6">Actualizar Estado y Avance</h3>
            
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
                    <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Evolución Energética</label>
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

          {/* Menú de Submódulos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href={`/admin/procesos/${process.id}/timeline`}>
              <div className="glass-card p-6 rounded-2xl border border-[#2A2A38] hover:border-[#C9A84C]/30 text-center flex flex-col items-center justify-center space-y-3 transition-colors cursor-pointer group">
                <Activity className="w-6 h-6 text-[#9A9AB0] group-hover:text-[#C9A84C] transition-colors" />
                <span className="text-xs font-mono tracking-widest text-[#F5F3EE] uppercase block">Timeline / Avances</span>
              </div>
            </Link>

            <div className="glass-card p-6 rounded-2xl border border-[#2A2A38] opacity-50 text-center flex flex-col items-center justify-center space-y-3">
              <Sparkles className="w-6 h-6 text-[#9A9AB0]" />
              <span className="text-xs font-mono tracking-widest text-[#F5F3EE] uppercase block">Multimedia</span>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-[#2A2A38] opacity-50 text-center flex flex-col items-center justify-center space-y-3">
              <CheckCircle className="w-6 h-6 text-[#9A9AB0]" />
              <span className="text-xs font-mono tracking-widest text-[#F5F3EE] uppercase block">Encuestas</span>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-[#2A2A38] opacity-50 text-center flex flex-col items-center justify-center space-y-3">
              <FileText className="w-6 h-6 text-[#9A9AB0]" />
              <span className="text-xs font-mono tracking-widest text-[#F5F3EE] uppercase block">Notas Privadas</span>
            </div>
          </div>

          {/* Ficha descriptiva */}
          <div className="glass-panel p-6 rounded-2xl border border-[#2A2A38]">
            <h3 className="font-serif text-lg text-[#F5F3EE] border-b border-[#2A2A38] pb-2 mb-4">Anotaciones del Ritual</h3>
            <p className="text-[#9A9AB0] text-sm leading-relaxed whitespace-pre-line">
              {process.description || "Sin anotaciones privadas para este proceso."}
            </p>
          </div>

        </div>

        {/* Lado Derecho: Ficha del Cliente e Información General */}
        <div className="space-y-6">
          
          {/* Card del Consultante */}
          <div className="glass-panel p-6 rounded-2xl border border-[#2A2A38] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#3D2B6B] rounded-full blur-[40px] opacity-20"></div>
            
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
                  <span className="text-xs text-[#9A9AB0] block uppercase font-mono tracking-wider">Teléfono / WhatsApp</span>
                  <span className="text-[#F5F3EE] block font-mono text-xs">{process.client.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Detalles Generales */}
          <div className="glass-panel p-6 rounded-2xl border border-[#2A2A38]">
            <h3 className="font-serif text-lg text-[#F5F3EE] border-b border-[#2A2A38] pb-2 mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2" /> Información General
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
              <div className="flex justify-between border-b border-[#2A2A38] pb-2">
                <span className="text-[#9A9AB0] font-mono text-xs uppercase">Duración Estimada</span>
                <span className="text-[#F5F3EE] font-mono">{process.estimatedDays ? `${process.estimatedDays} días` : "No especificado"}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#9A9AB0] font-mono text-xs uppercase">Fecha Registro</span>
                <span className="text-[#F5F3EE] text-xs font-mono">{process.createdAtStr}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
