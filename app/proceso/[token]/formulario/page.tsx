"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send, Upload, CheckCircle2, Loader2, ArrowLeft, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { saveClientForm, getClientForm, generateUploadUrl, saveUploadRecord } from "@/app/proceso/actions";
import Link from "next/link";

export default function ClientFormPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [step, setStep] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    intention: "",
    currentSituation: "",
  });

  const [file, setFile] = useState<File | null>(null);

  // Precargar datos si ya existen
  useEffect(() => {
    async function loadForm() {
      try {
        const data = await getClientForm(token);
        if (data) {
          setFormData({
            fullName: data.fullName || "",
            birthDate: data.birthDate || "",
            intention: data.intention || "",
            currentSituation: data.currentSituation || "",
          });
        }
      } catch (err) {
        console.error("Error al cargar formulario anterior:", err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadForm();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName.trim()) {
        toast.error("Por favor, ingresa tu nombre completo.");
        return;
      }
      if (!formData.birthDate) {
        toast.error("Por favor, selecciona tu fecha de nacimiento.");
        return;
      }
    }
    if (step === 2) {
      if (!formData.intention.trim()) {
        toast.error("Por favor, dinos tu propósito o intención.");
        return;
      }
      if (!formData.currentSituation.trim()) {
        toast.error("Por favor, describe tu situación actual.");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/") && !selected.name.toLowerCase().endsWith(".pdf") && !selected.name.toLowerCase().endsWith(".heic")) {
      toast.error("Solo se permiten imágenes (JPG, PNG, HEIC) o archivos PDF.");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      toast.error("El archivo no puede pesar más de 10 MB.");
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      // 1. Si hay archivo, subirlo a R2 primero
      if (file) {
        setIsUploadingFile(true);
        let fileType = file.type;
        if (!fileType) {
          if (file.name.toLowerCase().endsWith(".heic")) {
            fileType = "image/heic";
          } else if (file.name.toLowerCase().endsWith(".heif")) {
            fileType = "image/heif";
          } else if (file.name.toLowerCase().endsWith(".pdf")) {
            fileType = "application/pdf";
          } else {
            fileType = "image/jpeg";
          }
        }
        
        const uploadRes = await generateUploadUrl(token, file.name, fileType);
        if (!uploadRes.success || !uploadRes.signedUrl || !uploadRes.r2Key) {
          toast.error("No se pudo iniciar la subida del comprobante.");
          setIsSaving(false);
          setIsUploadingFile(false);
          return;
        }

        const putRes = await fetch(uploadRes.signedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": fileType },
        });

        if (!putRes.ok) {
          toast.error("Error al subir el comprobante a R2.");
          setIsSaving(false);
          setIsUploadingFile(false);
          return;
        }

        await saveUploadRecord(token, {
          r2Key: uploadRes.r2Key,
          fileName: file.name,
          mimeType: fileType,
          fileSizeBytes: file.size,
          isPaymentProof: true,
        });
        setIsUploadingFile(false);
      }

      // 2. Guardar formulario en base de datos
      const res = await saveClientForm(token, formData);
      if (res.success) {
        toast.success("¡Tus datos e intención han sido guardados con éxito!");
        setStep(4);
      } else {
        toast.error(res.error || "Ocurrió un error al enviar el formulario.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error del servidor.");
    } finally {
      setIsSaving(false);
      setIsUploadingFile(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin" />
        <p className="text-[#9A9AB0] text-sm font-mono tracking-widest uppercase">Cargando tu santuario...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden border border-[#C9A84C]/20"
      >
        {/* Barra de progreso superior */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#1A1A24]">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#C9A84C] to-[#F0D080]"
            initial={{ width: "0%" }}
            animate={{ width: step === 1 ? "25%" : step === 2 ? "50%" : step === 3 ? "75%" : "100%" }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Botón de volver al inicio si está en pasos 1-3 */}
        {step < 4 && (
          <Link href={`/proceso/${token}`}>
            <button className="absolute top-6 left-6 text-[#9A9AB0] hover:text-[#C9A84C] transition-colors flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </button>
          </Link>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 pt-4">
            <div className="text-center">
              <h2 className="font-serif text-2xl text-[#F5F3EE] mb-2">Conexión Inicial</h2>
              <p className="text-[#9A9AB0] text-xs">Necesitamos conocer tu información de nacimiento.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#9A9AB0] uppercase text-xs tracking-wider">Nombre Completo</Label>
                <Input 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="bg-[#0A0A0F]/50 border-[#2A2A38] text-[#F5F3EE] h-12 focus-visible:ring-[#C9A84C]/50"
                  placeholder="Tu nombre completo de nacimiento"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#9A9AB0] uppercase text-xs tracking-wider">Fecha de Nacimiento</Label>
                <Input 
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="bg-[#0A0A0F]/50 border-[#2A2A38] text-[#F5F3EE] h-12 [color-scheme:dark] focus-visible:ring-[#C9A84C]/50"
                />
              </div>
              <Button onClick={handleNext} className="w-full h-12 bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold mt-4">
                Siguiente Etapa ➜
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pt-4">
            <div className="text-center">
              <h2 className="font-serif text-2xl text-[#F5F3EE] mb-2">Tu Propósito</h2>
              <p className="text-[#9A9AB0] text-xs">¿Cuál es tu intención espiritual y qué deseas lograr?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#9A9AB0] uppercase text-xs tracking-wider">Intención Principal</Label>
                <textarea 
                  name="intention"
                  value={formData.intention}
                  onChange={handleChange}
                  className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] text-[#F5F3EE] rounded-lg p-3 min-h-24 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 text-sm resize-none"
                  placeholder="Escribe claramente lo que deseas pedir, sanar o resolver en este ritual..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#9A9AB0] uppercase text-xs tracking-wider">Situación Actual</Label>
                <textarea 
                  name="currentSituation"
                  value={formData.currentSituation}
                  onChange={handleChange}
                  className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] text-[#F5F3EE] rounded-lg p-3 min-h-24 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 text-sm resize-none"
                  placeholder="Describe cómo te encuentras actualmente, tus bloqueos o el problema..."
                />
              </div>
              <div className="flex gap-4">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 border-[#2A2A38] text-[#9A9AB0] hover:bg-[#1A1A24]">
                  Atrás
                </Button>
                <Button onClick={handleNext} className="flex-1 h-12 bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold">
                  Continuar
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pt-4">
            <div className="text-center">
              <h2 className="font-serif text-2xl text-[#F5F3EE] mb-2">Comprobante de Aportación</h2>
              <p className="text-[#9A9AB0] text-xs">Si tienes un comprobante de pago u ofrenda, puedes subirlo aquí (opcional).</p>
            </div>

            <div className="space-y-6">
              <div 
                onClick={() => document.getElementById("form-file-input")?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  file ? "border-emerald-500/40 bg-emerald-500/[0.01]" : "border-[#2A2A38] hover:border-[#C9A84C]/40 bg-[#0A0A0F]/30"
                }`}
              >
                <input 
                  id="form-file-input"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-emerald-400 text-sm font-medium">{file.name}</p>
                    <p className="text-[#9A9AB0] text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-red-400 underline hover:text-red-300 pt-1"
                    >
                      Quitar archivo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#1A1A24] flex items-center justify-center mb-2 mx-auto">
                      <Upload className="w-5 h-5 text-[#C9A84C]" />
                    </div>
                    <p className="text-[#F5F3EE] text-sm font-medium">Toca para seleccionar un archivo</p>
                    <p className="text-[#9A9AB0] text-xs">Imagen PNG, JPG, HEIC o PDF (hasta 10MB)</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-12 border-[#2A2A38] text-[#9A9AB0] hover:bg-[#1A1A24]">
                  Atrás
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSaving}
                  className="flex-1 h-12 bg-[#3D2B6B] hover:bg-[#6B4FA0] text-[#F5F3EE] font-semibold border border-[#6B4FA0]/30 shadow-[0_0_20px_rgba(61,43,107,0.3)] disabled:opacity-50"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isUploadingFile ? "Subiendo..." : "Guardando..."}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      Sellar Proceso
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="font-serif text-3xl text-[#F5F3EE] mb-2">Información Guardada</h2>
            <p className="text-[#9A9AB0] text-sm px-4 leading-relaxed">
              Tus datos espirituales han sido registrados con éxito. Tu guía los analizará para preparar las energías adecuadas.
            </p>
            <div className="pt-6">
              <Link href={`/proceso/${token}`}>
                <Button className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold uppercase tracking-wider text-xs px-6 py-3 rounded-xl h-11">
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
