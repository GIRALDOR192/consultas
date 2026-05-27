"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Clock,
  ArrowLeft,
  X,
  Check,
  Activity,
  Globe,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getAdminProcessUpdates,
  createProcessUpdate,
  deleteProcessUpdate,
  generateAdminUploadUrl,
  saveAdminUploadRecord,
} from "@/app/proceso/actions";
import { getProcessDetails } from "@/app/admin/actions";

interface UploadedFile {
  id: string;
  fileName: string;
  url: string;
}

interface ProcessUpdate {
  id: string;
  title: string | null;
  content: string;
  isPublic: boolean;
  createdAt: string;
  uploads: {
    id: string;
    fileName: string;
    url: string;
  }[];
}

export default function AdminTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Process data states
  const [r2Directory, setR2Directory] = useState("");
  const [workName, setWorkName] = useState("");
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  // Updates feed states
  const [updates, setUpdates] = useState<ProcessUpdate[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load process info and updates
  const loadFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    const data = await getAdminProcessUpdates(id);
    setUpdates(data as unknown as ProcessUpdate[]);
    setIsLoadingFeed(false);
  }, [id]);

  useEffect(() => {
    async function loadProcess() {
      setIsLoadingPage(true);
      try {
        const proc = await getProcessDetails(id);
        if (proc) {
          setWorkName(proc.workName);
          setR2Directory(proc.r2Directory);
          await loadFeed();
        } else {
          toast.error("Proceso no encontrado.");
          router.push("/admin/procesos");
        }
      } catch (err) {
        console.error("Error loading process:", err);
      } finally {
        setIsLoadingPage(false);
      }
    }
    loadProcess();
  }, [id, loadFeed, router]);

  // Handle files attachment & upload to R2
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !r2Directory) return;
    setIsUploading(true);
    const files = Array.from(e.target.files);

    for (const file of files) {
      const isImg = file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file.name);
      if (!isImg) {
        toast.error(`El archivo ${file.name} no es una imagen válida.`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`El archivo ${file.name} supera el límite de 20 MB.`);
        continue;
      }

      try {
        // Normalizar tipo de imagen
        let fileType = file.type;
        if (!fileType) {
          if (file.name.toLowerCase().endsWith(".heic")) fileType = "image/heic";
          else if (file.name.toLowerCase().endsWith(".heif")) fileType = "image/heif";
          else fileType = "image/jpeg";
        }

        const res = await generateAdminUploadUrl(id, file.name, fileType, r2Directory);
        if (!res.success || !res.signedUrl || !res.r2Key) {
          toast.error(`No se pudo iniciar la subida de ${file.name}`);
          continue;
        }

        // Subir a R2
        const uploadRes = await fetch(res.signedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": fileType },
        });

        if (!uploadRes.ok) {
          toast.error(`Error al subir ${file.name} a R2.`);
          continue;
        }

        // Guardar registro
        const saveRes = await saveAdminUploadRecord(id, {
          r2Key: res.r2Key,
          fileName: file.name,
          mimeType: fileType,
          fileSizeBytes: file.size,
          isPaymentProof: false, // Las fotos de novedades son de progreso
        });

        if (saveRes.success && saveRes.upload) {
          const previewUrl = URL.createObjectURL(file);
          setAttachedFiles((prev) => [
            ...prev,
            {
              id: saveRes.upload.id,
              fileName: file.name,
              url: previewUrl,
            },
          ]);
          toast.success(`Imagen ${file.name} subida y enlazada correctamente.`);
        } else {
          toast.error(`Error al guardar registro de ${file.name} en base de datos.`);
        }
      } catch (err) {
        console.error(err);
        toast.error(`Error al subir ${file.name}`);
      }
    }
    setIsUploading(false);
    // Reset inputs
    e.target.value = "";
  };

  // Remove attached image before publishing
  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Handle publishing update
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("El contenido de la novedad no puede estar vacío.");
      return;
    }

    setIsPublishing(true);
    try {
      const uploadIds = attachedFiles.map((f) => f.id);
      const res = await createProcessUpdate(
        id,
        title.trim() || null,
        content.trim(),
        isPublic,
        uploadIds
      );

      if (res.success) {
        toast.success("¡Novedad publicada en la bitácora!");
        setTitle("");
        setContent("");
        setIsPublic(true);
        setAttachedFiles([]);
        await loadFeed();
      } else {
        toast.error(res.error || "Ocurrió un error al publicar la novedad.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al procesar la publicación.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle deleting update
  const handleDeleteUpdate = async (updateId: string) => {
    if (!confirm("¿Seguro que deseas eliminar permanentemente este avance?")) return;

    try {
      const res = await deleteProcessUpdate(updateId, id);
      if (res.success) {
        toast.success("Avance eliminado correctamente.");
        await loadFeed();
      } else {
        toast.error(res.error || "Error al eliminar avance.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al conectar con el servidor.");
    }
  };

  if (isLoadingPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin" />
        <p className="text-[#9A9AB0] text-sm font-mono tracking-widest uppercase">
          Cargando bitácora de novedades...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2A2A38] pb-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/procesos/${id}`}>
            <Button variant="ghost" className="text-[#9A9AB0] hover:text-[#C9A84C] p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <span className="text-[10px] font-mono text-[#9A9AB0] uppercase tracking-widest">
              Línea de Tiempo y Bitácora
            </span>
            <h1 className="text-2xl font-serif text-[#F5F3EE] mt-1">{workName}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form to create new update (45%) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-[#2A2A38] space-y-5 sticky top-6">
            <div className="flex items-center gap-2 border-b border-[#2A2A38] pb-3">
              <Sparkles className="w-5 h-5 text-[#C9A84C]" />
              <h2 className="font-serif text-lg text-[#F5F3EE]">Nueva Novedad o Avance</h2>
            </div>

            <form onSubmit={handlePublish} className="space-y-4 text-left">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[#9A9AB0] text-[10px] font-mono tracking-widest uppercase">
                  Título (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Consagración del altar, Velación espiritual..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-4 py-2.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-11"
                />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-[#9A9AB0] text-[10px] font-mono tracking-widest uppercase">
                  Detalles del Progreso o Trabajo
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Describe de manera detallada las acciones espirituales realizadas, observaciones ritualísticas y el curso del proceso para que el consultante lo lea..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl p-4 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors min-h-[120px] resize-none leading-relaxed"
                />
              </div>

              {/* Visibility and File Upload */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-[#2A2A38]/50">
                {/* Visibility Toggle */}
                <div className="flex items-center justify-between gap-3 bg-[#0A0A0F]/60 px-4 py-2.5 rounded-xl border border-[#2A2A38] flex-1">
                  <span className="text-[10px] font-mono text-[#9A9AB0] uppercase tracking-wider">
                    {isPublic ? "Visible para Cliente" : "Solo Admin (Privado)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isPublic
                        ? "bg-[#C9A84C]/10 border-[#C9A84C]/30 text-[#C9A84C]"
                        : "bg-[#0A0A0F] border-[#2A2A38] text-[#9A9AB0]"
                    }`}
                    title={isPublic ? "Cambiar a privado" : "Cambiar a público"}
                  >
                    {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                </div>

                {/* Upload Trigger */}
                <button
                  type="button"
                  onClick={() => document.getElementById("timeline-file-upload")?.click()}
                  disabled={isUploading}
                  className="bg-[#0E0E16]/80 text-[#9A9AB0] border border-[#2A2A38] hover:text-[#C9A84C] hover:border-[#C9A84C]/30 text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" /> Adjuntar Foto
                    </>
                  )}
                </button>
                <input
                  id="timeline-file-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Attached Previews */}
              {attachedFiles.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-mono text-[#9A9AB0] uppercase tracking-widest">
                    Imágenes Adjuntas ({attachedFiles.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-[#0A0A0F]/30 border border-[#2A2A38]">
                    {attachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="aspect-square relative rounded-lg overflow-hidden border border-[#2A2A38] bg-[#0A0A0F] group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={file.url}
                          alt={file.fileName}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttachedFile(file.id)}
                          className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isPublishing || !content.trim()}
                  className="w-full bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold h-11 rounded-xl flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Publicar Avance <Check className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Timeline feed (55%) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-[#2A2A38] pb-3">
            <h2 className="font-serif text-lg text-[#F5F3EE] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#C9A84C]" /> Bitácora del Camino
            </h2>
            <span className="text-[10px] font-mono text-[#9A9AB0] bg-[#1A1A24] px-2 py-0.5 rounded-md border border-[#2A2A38]">
              {updates.length} {updates.length === 1 ? "Registro" : "Registros"}
            </span>
          </div>

          {isLoadingFeed ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
            </div>
          ) : updates.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl border border-[#2A2A38] text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#C9A84C]/5 border border-[#C9A84C]/15 flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6 text-[#C9A84C]/35" />
              </div>
              <h3 className="font-serif text-base text-[#F5F3EE]">Sin registros en la bitácora</h3>
              <p className="text-[#9A9AB0] text-xs max-w-sm mx-auto leading-relaxed">
                Utiliza el panel de la izquierda para registrar la primera novedad, fotos de progreso y
                detalles sobre los rituales para compartirlos con el consultante.
              </p>
            </div>
          ) : (
            <div className="relative pl-8 space-y-6 text-left">
              {/* Vertical line */}
              <div className="absolute left-3 top-3 bottom-3 w-px bg-gradient-to-b from-[#C9A84C]/30 via-[#3D2B6B]/20 to-transparent" />

              <AnimatePresence initial={false}>
                {updates.map((update, i) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative group"
                  >
                    {/* Circle marker */}
                    <div className="absolute -left-8 top-3 w-6 h-6 rounded-full bg-[#0A0A0F] border-2 border-[#C9A84C]/40 flex items-center justify-center shadow-[0_0_10px_rgba(201,168,76,0.1)] transition-colors group-hover:border-[#C9A84C]">
                      <Activity className="w-3 h-3 text-[#C9A84C]" />
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-[#2A2A38] hover:border-[#C9A84C]/15 transition-all space-y-4">
                      {/* Title & Metadata */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          {update.title ? (
                            <h3 className="font-serif text-base text-[#F5F3EE]">{update.title}</h3>
                          ) : (
                            <h3 className="font-mono text-xs text-[#9A9AB0] uppercase tracking-wider">
                              Avance del Trabajo
                            </h3>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-[#9A9AB0]/70 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {update.createdAt}
                            </span>
                            <span
                              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] border ${
                                update.isPublic
                                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                                  : "bg-[#2A2A38]/30 border-[#2A2A38] text-[#9A9AB0]"
                              }`}
                            >
                              {update.isPublic ? (
                                <>
                                  <Eye className="w-2.5 h-2.5" /> Público (Cliente)
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-2.5 h-2.5" /> Privado
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <button
                          onClick={() => handleDeleteUpdate(update.id)}
                          className="text-[#9A9AB0] hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Eliminar avance"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Content */}
                      <p className="text-xs text-[#9A9AB0] leading-relaxed whitespace-pre-wrap">
                        {update.content}
                      </p>

                      {/* Attached Gallery */}
                      {update.uploads && update.uploads.length > 0 && (
                        <div
                          className={`grid gap-2 mt-4 ${
                            update.uploads.length === 1
                              ? "grid-cols-1"
                              : update.uploads.length === 2
                              ? "grid-cols-2"
                              : "grid-cols-3"
                          }`}
                        >
                          {update.uploads.map((upload) => (
                            <div
                              key={upload.id}
                              className="aspect-[4/3] relative rounded-xl overflow-hidden border border-[#2A2A38] bg-[#0A0A0F] group/img"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={upload.url}
                                alt={upload.fileName}
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                onClick={() => window.open(upload.url, "_blank")}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
