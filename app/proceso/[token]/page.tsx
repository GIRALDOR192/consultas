"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sparkles,
  BookOpen,
  Camera,
  Calendar,
  DollarSign,
  Activity,
  X,
  Upload,
  Loader2,
  ImageIcon,
  Check,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getClientProcessByToken,
  generateUploadUrl,
  saveUploadRecord,
} from "@/app/proceso/actions";

interface ProcessData {
  id: string;
  token: string;
  r2Directory: string;
  workName: string;
  clientName: string;
  clientPhone: string | null;
  status: string;
  statusLabel: string;
  progressPercent: number;
  price: string;
  currency: string;
  clientMessage: string | null;
  hasFormSubmitted: boolean;
  createdAtStr: string;
  updates: {
    id: string;
    title: string | null;
    content: string;
    createdAt: string;
  }[];
}

const statusColors: Record<string, string> = {
  PENDING: "text-[#9A9AB0] border-[#9A9AB0]/40 bg-[#9A9AB0]/5",
  PAYMENT_RECEIVED: "text-emerald-400 border-emerald-400/40 bg-emerald-400/5",
  PREPARATION: "text-[#C9A84C] border-[#C9A84C]/40 bg-[#C9A84C]/5",
  IN_PROGRESS: "text-[#A78BFA] border-[#A78BFA]/40 bg-[#A78BFA]/5",
  SEALED: "text-[#C9A84C] border-[#C9A84C]/40 bg-[#C9A84C]/10",
  COMPLETED: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  PAUSED: "text-orange-400 border-orange-400/40 bg-orange-400/5",
  CANCELLED: "text-red-400 border-red-400/40 bg-red-400/5",
};

export default function ClientPortalHome() {
  const params = useParams();
  const token = params.token as string;

  const [proc, setProc] = useState<ProcessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getClientProcessByToken(token);
      setProc(data as ProcessData | null);
      setIsLoading(false);
    }
    load();
  }, [token]);

  const handleFileSelect = (file: File) => {
    const isImage = file.type.startsWith("image/") || 
                    /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file.name);
    if (!isImage) {
      toast.error("Solo se permiten imágenes (PNG, JPG, HEIC, etc.).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no puede pesar más de 10 MB.");
      return;
    }
    setUploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !proc) return;
    setIsUploading(true);
    try {
      // Normalizar MIME type
      let fileType = uploadFile.type;
      if (!fileType) {
        if (uploadFile.name.toLowerCase().endsWith(".heic")) {
          fileType = "image/heic";
        } else if (uploadFile.name.toLowerCase().endsWith(".heif")) {
          fileType = "image/heif";
        } else {
          fileType = "image/jpeg";
        }
      }

      const res = await generateUploadUrl(token, uploadFile.name, fileType);
      if (!res.success || !res.signedUrl || !res.r2Key) {
        toast.error("No se pudo iniciar la subida.");
        return;
      }

      // Upload directly to R2
      const uploadRes = await fetch(res.signedUrl, {
        method: "PUT",
        body: uploadFile,
        headers: { "Content-Type": fileType },
      });

      if (!uploadRes.ok) {
        toast.error("Error al subir la imagen a R2.");
        return;
      }

      // Save record in DB
      await saveUploadRecord(token, {
        r2Key: res.r2Key,
        fileName: uploadFile.name,
        mimeType: fileType,
        fileSizeBytes: uploadFile.size,
        isPaymentProof: false,
      });

      setUploadSuccess(true);
      toast.success("¡Imagen subida con éxito!");
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadSuccess(false);
      }, 1500);
    } catch (err) {
      toast.error("Error inesperado al subir.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] w-full space-y-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border border-[#C9A84C]/30 border-t-[#C9A84C] flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6 text-[#C9A84C] opacity-60" />
        </motion.div>
        <p className="text-[#9A9AB0] font-mono text-xs tracking-[0.3em] uppercase animate-pulse">
          Abriendo tu santuario...
        </p>
      </div>
    );
  }

  if (!proc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <X className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="font-serif text-2xl text-[#F5F3EE]">Acceso No Encontrado</h2>
        <p className="text-[#9A9AB0] text-sm max-w-sm">
          Este enlace no corresponde a ningún proceso activo. Verifica que el enlace sea correcto.
        </p>
      </div>
    );
  }

  const colorClass = statusColors[proc.status] ?? statusColors["PENDING"];
  const progress = proc.progressPercent;

  const statusSubtexts: Record<string, string> = {
    PENDING: "Estamos revisando tus datos iniciales para el ritual.",
    PAYMENT_RECEIVED: "Aportación energética confirmada. Tu guía preparará las ofrendas pronto.",
    PREPARATION: "Tu guía está canalizando energías iniciales y alistando los altares sagrados.",
    IN_PROGRESS: "El ritual está activo y en constante evolución espiritual en el altar.",
    SEALED: "Tu petición y ofrendas han sido selladas para tu protección definitiva.",
    COMPLETED: "El proceso ha culminado de manera exitosa. ¡Muchas bendiciones!",
    PAUSED: "El proceso se encuentra pausado temporalmente.",
    CANCELLED: "Este proceso espiritual ha sido cancelado.",
  };

  const statusExplain = statusSubtexts[proc.status] ?? "Tu proceso espiritual se está desarrollando.";
  const latestUpdate = proc.updates.length > 0 ? proc.updates[proc.updates.length - 1] : null;

  return (
    <>
      <div className="flex flex-col items-center w-full space-y-10">

        {/* Warning Banner - Formulario Faltante (Poka-yoke) */}
        {!proc.hasFormSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between text-orange-400 text-xs shadow-lg animate-pulse"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div className="text-left">
                <p className="font-semibold text-sm">Faltan datos importantes</p>
                <p className="text-[#9A9AB0]">Llenar tu fecha de nacimiento e intención espiritual es vital.</p>
              </div>
            </div>
            <Link href={`/proceso/${token}/formulario`}>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl px-4 py-1.5 h-8">
                Llenar ahora
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Hero: Bienvenida + Nombre ritual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-center space-y-4 pt-4"
        >
          <p className="text-[#9A9AB0] font-mono text-xs tracking-[0.3em] uppercase">
            Bienvenida/o,{" "}
            <span className="text-[#C9A84C] font-semibold">{proc.clientName}</span>
          </p>
          <h1 className="font-serif text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-[#F5F3EE] to-[#9A9AB0] tracking-tight leading-tight max-w-xl mx-auto">
            {proc.workName}
          </h1>

          {proc.clientMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="max-w-md mx-auto glass-panel px-6 py-4 rounded-2xl border border-[#C9A84C]/15 text-sm text-[#9A9AB0] italic leading-relaxed"
            >
              <MessageCircle className="w-4 h-4 text-[#C9A84C] inline mr-2 mb-0.5" />
              {proc.clientMessage}
            </motion.div>
          )}
        </motion.div>

        {/* Círculo de Estado y Progreso */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full border border-[#2A2A38]/50" />
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="50%" cy="50%" r="48%" className="fill-none stroke-[#2A2A38] stroke-[2px]" />
            <motion.circle
              cx="50%" cy="50%" r="48%"
              className="fill-none stroke-[#C9A84C] stroke-[2px]"
              strokeDasharray="300"
              initial={{ strokeDashoffset: 300 }}
              animate={{ strokeDashoffset: 300 - (300 * progress) / 100 }}
              transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#C9A84C]/5 to-[#3D2B6B]/5 backdrop-blur-md flex flex-col items-center justify-center border border-[#C9A84C]/10 shadow-[0_0_40px_rgba(201,168,76,0.05)]">
            <Sparkles className="w-5 h-5 text-[#C9A84C]/40 mb-1" />
            <span className="text-[9px] font-mono text-[#9A9AB0] tracking-[0.2em] uppercase text-center px-2">
              Estado del Ritual
            </span>
            <span className="text-xl font-serif text-[#C9A84C] font-semibold mt-1">{progress}%</span>
          </div>
        </motion.div>

        {/* Estado Ritualístico e Indicaciones Simples (Campesinos y personas mayores) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center space-y-3"
        >
          <div className={`px-6 py-2.5 rounded-full border flex items-center space-x-3 w-fit mx-auto ${colorClass}`}>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="font-semibold tracking-wider text-xs uppercase font-mono">
              {proc.statusLabel}
            </span>
          </div>
          <p className="text-sm text-[#F5F3EE] font-medium max-w-sm mx-auto leading-relaxed">
            {statusExplain}
          </p>
        </motion.div>

        {/* Novedades y Mensajes Directos del Guía (No requiere navegación extra) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-[#2A2A38] space-y-4 text-left"
        >
          <div className="flex items-center justify-between border-b border-[#2A2A38] pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A84C]"></span>
              </span>
              <h3 className="font-serif text-sm text-[#F5F3EE] uppercase tracking-wider font-semibold">Mensajes y Novedades de tu Guía</h3>
            </div>
            {latestUpdate && (
              <span className="text-[10px] font-mono text-[#9A9AB0]/60">{latestUpdate.createdAt}</span>
            )}
          </div>

          {latestUpdate ? (
            <div className="space-y-3">
              {latestUpdate.title && (
                <h4 className="font-serif text-[#C9A84C] text-sm font-semibold">{latestUpdate.title}</h4>
              )}
              <p className="text-sm text-[#F5F3EE]/90 leading-relaxed italic bg-[#0A0A0F]/30 p-3 rounded-xl border border-[#2A2A38]/30">
                "{latestUpdate.content}"
              </p>
              <div className="flex justify-end pt-1">
                <Link href={`/proceso/${token}/timeline`}>
                  <Button variant="ghost" className="text-[#C9A84C] hover:text-[#F0D080] text-xs font-semibold p-0 flex items-center gap-1.5 hover:bg-transparent">
                    Ver todos los avances <span>➜</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-[#9A9AB0] text-xs leading-relaxed text-center py-4">
              Tu guía espiritual está preparando los materiales y altares. Cualquier indicación o avance aparecerá aquí de inmediato.
            </p>
          )}
        </motion.div>

        {/* Módulos de acceso rápido (Poka-yoke con indicadores visuales de completado) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="w-full max-w-lg grid grid-cols-2 gap-4"
        >
          <Link href={`/proceso/${token}/formulario`}>
            <div className={`glass-card p-6 rounded-2xl border transition-all cursor-pointer group flex flex-col items-center space-y-3 hover:shadow-[0_0_20px_rgba(201,168,76,0.06)] ${
              proc.hasFormSubmitted 
                ? "border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/[0.01]" 
                : "border-orange-500/30 hover:border-orange-500/50 bg-orange-500/[0.02] shadow-[0_0_15px_rgba(249,115,22,0.03)]"
            }`}>
              <BookOpen className={`w-6 h-6 group-hover:scale-110 transition-transform ${proc.hasFormSubmitted ? "text-emerald-400" : "text-orange-400"}`} />
              <span className="text-xs tracking-widest text-[#F5F3EE] uppercase font-mono">Formulario</span>
              <span className={`text-[10px] font-semibold tracking-wide ${proc.hasFormSubmitted ? "text-emerald-400" : "text-orange-400 animate-pulse"}`}>
                {proc.hasFormSubmitted ? "✓ Completado" : "⚠️ Pendiente"}
              </span>
            </div>
          </Link>

          <Link href={`/proceso/${token}/timeline`}>
            <div className="glass-card p-6 rounded-2xl border border-[#2A2A38] hover:border-[#C9A84C]/30 transition-all cursor-pointer group flex flex-col items-center space-y-3 hover:shadow-[0_0_20px_rgba(201,168,76,0.06)]">
              <Activity className="w-6 h-6 text-[#9A9AB0] group-hover:text-[#C9A84C] transition-colors" />
              <span className="text-xs tracking-widest text-[#F5F3EE] uppercase font-mono">Historial</span>
              <span className="text-[10px] text-[#9A9AB0] text-center">Todos los avances</span>
            </div>
          </Link>

          <Link href={`/proceso/${token}/bitacora`}>
            <div className="glass-card p-6 rounded-2xl border border-[#2A2A38] hover:border-[#C9A84C]/30 transition-all cursor-pointer group flex flex-col items-center space-y-3 hover:shadow-[0_0_20px_rgba(201,168,76,0.06)]">
              <Moon className="w-6 h-6 text-[#9A9AB0] group-hover:text-[#C9A84C] transition-colors" />
              <span className="text-xs tracking-widest text-[#F5F3EE] uppercase font-mono">Mi Bitácora</span>
              <span className="text-[10px] text-[#9A9AB0] text-center">Escribir cómo me siento</span>
            </div>
          </Link>

          <button onClick={() => setShowUploadModal(true)}>
            <div className="glass-card p-6 rounded-2xl border border-[#2A2A38] hover:border-[#C9A84C]/30 transition-all cursor-pointer group flex flex-col items-center space-y-3 w-full hover:shadow-[0_0_20px_rgba(201,168,76,0.06)]">
              <Camera className="w-6 h-6 text-[#9A9AB0] group-hover:text-[#C9A84C] transition-colors" />
              <span className="text-xs tracking-widest text-[#F5F3EE] uppercase font-mono">Subir Fotos</span>
              <span className="text-[10px] text-[#9A9AB0] text-center">Enviar imágenes</span>
            </div>
          </button>
        </motion.div>
      </div>

      {/* Modal de subida de imágenes */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A0A0F]/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowUploadModal(false);
                setUploadFile(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel border border-[#2A2A38] rounded-3xl p-8 max-w-md w-full space-y-6 relative"
            >
              <button
                onClick={() => { setShowUploadModal(false); setUploadFile(null); }}
                className="absolute top-4 right-4 text-[#9A9AB0] hover:text-[#F5F3EE] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mx-auto">
                  <Camera className="w-5 h-5 text-[#C9A84C]" />
                </div>
                <h3 className="font-serif text-xl text-[#F5F3EE]">Compartir Imagen</h3>
                <p className="text-[#9A9AB0] text-xs">
                  Puedes compartir imágenes de tu hogar, ofrenda o lo que desees mostrar.
                </p>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-[#C9A84C] bg-[#C9A84C]/5"
                    : uploadFile
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-[#2A2A38] hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/3"
                }`}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                  }}
                />

                {uploadFile ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-emerald-400 text-sm font-medium">{uploadFile.name}</p>
                    <p className="text-[#9A9AB0] text-xs">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <ImageIcon className="w-10 h-10 text-[#9A9AB0] mx-auto" />
                    <p className="text-[#9A9AB0] text-sm">
                      Arrastra una imagen aquí o haz clic para seleccionar
                    </p>
                    <p className="text-[#9A9AB0]/60 text-xs">PNG, JPG, HEIC hasta 10 MB</p>
                  </div>
                )}
              </div>

              {uploadFile && (
                <button
                  onClick={handleUploadSubmit}
                  disabled={isUploading}
                  className="w-full py-3 rounded-xl bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                  ) : uploadSuccess ? (
                    <><Check className="w-4 h-4" /> ¡Imagen enviada!</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Enviar imagen</>
                  )}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
