"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Upload, Paperclip, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClientFormPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    intention: "",
    currentSituation: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(step + 1);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden border border-[#C9A84C]/20"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-[#1A1A24]">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#C9A84C] to-[#F0D080]"
            initial={{ width: "0%" }}
            animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="text-center">
              <h2 className="font-serif text-3xl text-[#F5F3EE] mb-2">Conexión Inicial</h2>
              <p className="text-[#9A9AB0] text-sm">Necesitamos conocer tu energía fundamental.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#9A9AB0] uppercase text-xs tracking-wider">Nombre Completo</Label>
                <Input 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="bg-[#0A0A0F]/50 border-[#2A2A38] text-[#F5F3EE] h-12"
                  placeholder="Tu nombre de nacimiento"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#9A9AB0] uppercase text-xs tracking-wider">Fecha de Nacimiento</Label>
                <Input 
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="bg-[#0A0A0F]/50 border-[#2A2A38] text-[#F5F3EE] h-12 [color-scheme:dark]"
                />
              </div>
              <Button onClick={handleNext} className="w-full h-12 bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold mt-4">
                Siguiente Etapa
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="text-center">
              <h2 className="font-serif text-3xl text-[#F5F3EE] mb-2">Propósito</h2>
              <p className="text-[#9A9AB0] text-sm">¿Cuál es la intención de este trabajo?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#9A9AB0] uppercase text-xs tracking-wider">Intención Principal</Label>
                <textarea 
                  name="intention"
                  value={formData.intention}
                  onChange={handleChange}
                  className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] text-[#F5F3EE] rounded-lg p-3 min-h-24 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50"
                  placeholder="Escribe lo que deseas conseguir..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#9A9AB0] uppercase text-xs tracking-wider">Situación Actual</Label>
                <textarea 
                  name="currentSituation"
                  value={formData.currentSituation}
                  onChange={handleChange}
                  className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] text-[#F5F3EE] rounded-lg p-3 min-h-24 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50"
                  placeholder="Describe cómo te sientes actualmente..."
                />
              </div>
              <div className="flex gap-4">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 border-[#2A2A38] text-[#9A9AB0] hover:bg-[#1A1A24]">
                  Volver
                </Button>
                <Button onClick={handleNext} className="flex-1 h-12 bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold">
                  Continuar
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="text-center">
              <h2 className="font-serif text-3xl text-[#F5F3EE] mb-2">Intercambio</h2>
              <p className="text-[#9A9AB0] text-sm">Sube tu comprobante de aportación energética.</p>
            </div>

            <div className="space-y-6">
              <div className="border-2 border-dashed border-[#2A2A38] hover:border-[#C9A84C]/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-[#0A0A0F]/30 group">
                <div className="w-12 h-12 rounded-full bg-[#1A1A24] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-[#C9A84C]" />
                </div>
                <p className="text-[#F5F3EE] text-sm mb-1">Haz clic para subir imagen o PDF</p>
                <p className="text-[#9A9AB0] text-xs">Máximo 5MB</p>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-12 border-[#2A2A38] text-[#9A9AB0] hover:bg-[#1A1A24]">
                  Volver
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1 h-12 bg-[#3D2B6B] hover:bg-[#6B4FA0] text-[#F5F3EE] font-semibold border border-[#6B4FA0]/30 shadow-[0_0_20px_rgba(61,43,107,0.3)]">
                  <Send className="w-4 h-4 mr-2" />
                  Sellar Proceso
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="font-serif text-3xl text-[#F5F3EE] mb-2">Información Sellada</h2>
            <p className="text-[#9A9AB0] text-sm px-4">Tu proceso ha iniciado. Te notificaremos cuando se analicen tus datos y comience la preparación energética.</p>
            <div className="pt-8">
              <Button variant="ghost" className="text-[#C9A84C] hover:text-[#F0D080] uppercase tracking-wider text-xs">
                Ir al Panel Principal
              </Button>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
