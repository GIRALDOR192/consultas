"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ImageIcon,
  Upload,
  Loader2,
  Check,
  X,
  Receipt,
  Images,
  User,
  Shield,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getProcessUploads,
  generateAdminUploadUrl,
  saveAdminUploadRecord,
  getSignedReadUrl,
} from "@/app/proceso/actions";
import { getProcessDetails } from "@/app/admin/actions";

interface Upload {
  id: string;
  r2Key: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  isPaymentProof: boolean;
  uploadedBy: string;
  createdAt: string;
}

export default function AdminMultimediaPage() {
  const params = useParams();
  const id = params.id as string;

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [processToken, setProcessToken] = useState("");
  const [r2Directory, setR2Directory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"comprobantes" | "galeria">("comprobantes");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForPayment, setUploadForPayment] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const [uploadsData, procData] = await Promise.all([
        getProcessUploads(id),
        getProcessDetails(id),
      ]);
      setUploads(uploadsData as Upload[]);
      if (procData) {
        setProcessToken(procData.token);
        setR2Directory(procData.r2Directory);
      }
      setIsLoading(false);
    }
    load();
  }, [id]);

  // Load signed URLs for display
  useEffect(() => {
    async function loadSignedUrls() {
      const urlMap: Record<string, string> = {};
      for (const upload of uploads) {
        const res = await getSignedReadUrl(upload.r2Key);
        if (res.success && res.url) {
          urlMap[upload.id] = res.url;
        }
      }
      setSignedUrls(urlMap);
    }
    if (uploads.length > 0) {
      loadSignedUrls();
    }
  }, [uploads]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("La imagen no puede pesar más de 20 MB.");
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

  const handleUpload = async () => {
    if (!uploadFile || !r2Directory) return;
    setIsUploading(true);
    try {
      const res = await generateAdminUploadUrl(id, uploadFile.name, uploadFile.type, r2Directory);
      if (!res.success || !res.signedUrl || !res.r2Key) {
        toast.error("No se pudo iniciar la subida.");
        return;
      }

      const uploadRes = await fetch(res.signedUrl, {
        method: "PUT",
        body: uploadFile,
        headers: { "Content-Type": uploadFile.type },
      });

      if (!uploadRes.ok) {
        toast.error("Error al subir la imagen a R2.");
        return;
      }

      await saveAdminUploadRecord(id, {
        r2Key: res.r2Key,
        fileName: uploadFile.name,
        mimeType: uploadFile.type,
        fileSizeBytes: uploadFile.size,
        isPaymentProof: uploadForPayment,
      });

      toast.success(`¡${uploadForPayment ? "Comprobante" : "Imagen"} subido con éxito!`);
      setUploadFile(null);

      // Reload uploads
      const updated = await getProcessUploads(id);
      setUploads(updated as Upload[]);
    } catch (err) {
      toast.error("Error inesperado al subir.");
    } finally {
      setIsUploading(false);
    }
  };

  const paymentProofs = uploads.filter((u) => u.isPaymentProof);
  const galleryImages = uploads.filter((u) => !u.isPaymentProof);
  const displayList = activeTab === "comprobantes" ? paymentProofs : galleryImages;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[#2A2A38] pb-6">
        <Link href={`/admin/procesos/${id}`}>
          <Button variant="ghost" className="text-[#9A9AB0] hover:text-[#C9A84C] p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <p className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Multimedia</p>
          <h1 className="text-2xl font-serif text-[#F5F3EE]">Archivos del Proceso</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Panel */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-[#2A2A38] space-y-5">
            <h3 className="font-serif text-[#C9A84C] text-lg">Subir Archivo</h3>

            {/* Tipo de archivo */}
            <div className="space-y-2">
              <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setUploadForPayment(true)}
                  className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                    uploadForPayment
                      ? "border-[#C9A84C]/50 bg-[#C9A84C]/10 text-[#F5F3EE]"
                      : "border-[#2A2A38] text-[#9A9AB0] hover:border-[#C9A84C]/20"
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Comprobante
                </button>
                <button
                  onClick={() => setUploadForPayment(false)}
                  className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                    !uploadForPayment
                      ? "border-[#C9A84C]/50 bg-[#C9A84C]/10 text-[#F5F3EE]"
                      : "border-[#2A2A38] text-[#9A9AB0] hover:border-[#C9A84C]/20"
                  }`}
                >
                  <Images className="w-4 h-4" />
                  Multimedia
                </button>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("admin-file-input")?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-[#C9A84C] bg-[#C9A84C]/5"
                  : uploadFile
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-[#2A2A38] hover:border-[#C9A84C]/40"
              }`}
            >
              <input
                id="admin-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                }}
              />
              {uploadFile ? (
                <div className="space-y-2">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-emerald-400 text-xs font-medium truncate">{uploadFile.name}</p>
                  <p className="text-[#9A9AB0] text-xs">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="w-8 h-8 text-[#9A9AB0] mx-auto" />
                  <p className="text-[#9A9AB0] text-xs">Arrastra o haz clic para seleccionar</p>
                  <p className="text-[#9A9AB0]/50 text-[10px]">Máx. 20 MB</p>
                </div>
              )}
            </div>

            {uploadFile && (
              <div className="space-y-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Subir {uploadForPayment ? "comprobante" : "imagen"}</>
                  )}
                </Button>
                <button
                  onClick={() => setUploadFile(null)}
                  className="w-full text-xs text-[#9A9AB0] hover:text-[#F5F3EE] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tabs */}
          <div className="flex gap-2">
            {(["comprobantes", "galeria"] as const).map((tab) => {
              const count = tab === "comprobantes" ? paymentProofs.length : galleryImages.length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-widest transition-all ${
                    activeTab === tab
                      ? "bg-[#C9A84C]/15 border border-[#C9A84C]/40 text-[#C9A84C]"
                      : "text-[#9A9AB0] hover:text-[#F5F3EE] border border-[#2A2A38]"
                  }`}
                >
                  {tab === "comprobantes" ? <Receipt className="w-3.5 h-3.5" /> : <Images className="w-3.5 h-3.5" />}
                  {tab === "comprobantes" ? "Comprobantes" : "Galería"}
                  {count > 0 && (
                    <span className="bg-[#2A2A38] text-[#9A9AB0] px-1.5 py-0.5 rounded-full text-[9px]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" />
            </div>
          ) : displayList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel p-10 rounded-2xl border border-[#2A2A38] text-center space-y-4"
            >
              {activeTab === "comprobantes" ? (
                <Receipt className="w-10 h-10 text-[#9A9AB0]/30 mx-auto" />
              ) : (
                <Images className="w-10 h-10 text-[#9A9AB0]/30 mx-auto" />
              )}
              <p className="text-[#9A9AB0] text-sm">
                {activeTab === "comprobantes"
                  ? "No hay comprobantes de pago aún. Súbelos usando el panel izquierdo."
                  : "No hay imágenes en la galería. Sube material multimedia del ritual."}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {displayList.map((upload, i) => (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-panel rounded-2xl border border-[#2A2A38] overflow-hidden group hover:border-[#C9A84C]/20 transition-colors"
                >
                  {signedUrls[upload.id] ? (
                    <div className="aspect-square relative overflow-hidden bg-[#0A0A0F]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={signedUrls[upload.id]}
                        alt={upload.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <a
                        href={signedUrls[upload.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#0A0A0F]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#C9A84C]" />
                      </a>
                    </div>
                  ) : (
                    <div className="aspect-square bg-[#0A0A0F]/60 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-[#9A9AB0]/30" />
                    </div>
                  )}

                  <div className="p-3 space-y-1">
                    <p className="text-[#F5F3EE] text-xs truncate font-medium">{upload.fileName}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-[#9A9AB0]">
                        {upload.uploadedBy === "admin" ? (
                          <><Shield className="w-3 h-3" /> Admin</>
                        ) : (
                          <><User className="w-3 h-3" /> Cliente</>
                        )}
                      </div>
                      <span className="text-[10px] text-[#9A9AB0]/60">{(upload.fileSizeBytes / 1024).toFixed(0)} KB</span>
                    </div>
                    <p className="text-[10px] text-[#9A9AB0]/50">{upload.createdAt}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
