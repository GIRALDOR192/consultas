"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Copy, 
  Loader2,
  Calendar,
  DollarSign,
  User,
  Activity
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createProcess } from "@/app/admin/actions";
import { ProcessStatus, Priority } from "@prisma/client";

export default function AdminNuevoProcesoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProcess, setCreatedProcess] = useState<{ token: string; workName: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form states
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [workName, setWorkName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [status, setStatus] = useState<ProcessStatus>("PENDING");
  const [priority, setPriority] = useState<Priority>("NORMAL");
  const [phonePrefix, setPhonePrefix] = useState("+57");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientMessage, setClientMessage] = useState("");

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!clientName) {
        toast.error("El nombre del consultante es obligatorio.");
        return;
      }
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workName || !price) {
      toast.error("Por favor completa los campos requeridos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullPhone = phoneNumber ? `${phonePrefix} ${phoneNumber}` : undefined;
      const res = await createProcess({
        clientName,
        clientEmail: clientEmail || undefined,
        clientPhone: fullPhone,
        workName,
        description: description || undefined,
        price: parseFloat(price) || 0,
        currency,
        status,
        priority,
        clientMessage: clientMessage || undefined
      });

      if (res.success && res.process) {
        toast.success("¡Seguimiento espiritual iniciado con éxito!");
        setCreatedProcess({
          token: res.process.token,
          workName: res.process.workName
        });
        setStep(3);
      } else {
        toast.error(res.error || "Ocurrió un error al registrar el proceso.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getShareLink = () => {
    if (typeof window === "undefined" || !createdProcess) return "";
    return `${window.location.origin}/proceso/${createdProcess.token}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareLink());
    setIsCopied(true);
    toast.success("¡Enlace copiado al portapapeles!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[#2A2A38] pb-6">
        <Link href="/admin/procesos">
          <Button variant="ghost" className="text-[#9A9AB0] hover:text-[#C9A84C] p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-[#F5F3EE]">Iniciar Trabajo Espiritual</h1>
          <p className="text-[#9A9AB0] text-sm mt-1">Registra un nuevo proceso de seguimiento y ritualización.</p>
        </div>
      </div>

      {/* Stepper indicator */}
      {step < 3 && (
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs border ${step === 1 ? 'bg-[#C9A84C] text-[#0A0A0F] border-[#C9A84C]' : 'bg-[#1A1A24] text-[#C9A84C] border-[#2A2A38]'}`}>1</span>
            <span className={`text-xs font-mono tracking-widest uppercase ${step === 1 ? 'text-[#F5F3EE]' : 'text-[#9A9AB0]'}`}>Consultante</span>
          </div>
          <div className="w-12 h-px bg-[#2A2A38]"></div>
          <div className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs border ${step === 2 ? 'bg-[#C9A84C] text-[#0A0A0F] border-[#C9A84C]' : 'bg-[#1A1A24] text-[#9A9AB0] border-[#2A2A38]'}`}>2</span>
            <span className={`text-xs font-mono tracking-widest uppercase ${step === 2 ? 'text-[#F5F3EE]' : 'text-[#9A9AB0]'}`}>Ritual</span>
          </div>
        </div>
      )}

      {/* Content Form Card */}
      <div className="glass-panel p-8 rounded-2xl border border-[#2A2A38] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleNextStep}
              className="space-y-6"
            >
              <h3 className="font-serif text-lg text-[#C9A84C] border-b border-[#2A2A38] pb-2">Información del Consultante</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. María Elena Rodríguez"
                    className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-4 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Correo Electrónico (Opcional)</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="maria.rodriguez@example.com"
                    className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-4 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Teléfono / WhatsApp (Opcional)</label>
                  <div className="flex gap-2">
                    <select
                      value={phonePrefix}
                      onChange={(e) => setPhonePrefix(e.target.value)}
                      className="w-36 bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-3 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12 cursor-pointer shrink-0"
                    >
                      <option value="+52">🇲🇽 +52 MX</option>
                      <option value="+57">🇨🇴 +57 CO</option>
                      <option value="+54">🇦🇷 +54 AR</option>
                      <option value="+58">🇻🇪 +58 VE</option>
                      <option value="+1">🇺🇸 +1 US</option>
                      <option value="+34">🇪🇸 +34 ES</option>
                      <option value="+51">🇵🇪 +51 PE</option>
                      <option value="+56">🇨🇱 +56 CL</option>
                      <option value="+55">🇧🇷 +55 BR</option>
                      <option value="+593">🇪🇨 +593 EC</option>
                      <option value="+502">🇬🇹 +502 GT</option>
                      <option value="+503">🇸🇻 +503 SV</option>
                      <option value="+507">🇵🇦 +507 PA</option>
                      <option value="+591">🇧🇴 +591 BO</option>
                      <option value="+595">🇵🇾 +595 PY</option>
                      <option value="+598">🇺🇾 +598 UY</option>
                    </select>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="3224832415"
                      className="flex-1 bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-4 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12"
                    />
                  </div>
                  {phoneNumber && (
                    <p className="text-[#9A9AB0] text-xs font-mono">→ {phonePrefix} {phoneNumber}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold">
                  Siguiente paso <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <h3 className="font-serif text-lg text-[#C9A84C] border-b border-[#2A2A38] pb-2">Detalles del Proceso Espiritual</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Nombre del Trabajo *</label>
                  <input
                    type="text"
                    required
                    value={workName}
                    onChange={(e) => setWorkName(e.target.value)}
                    placeholder="Ej. Apertura de Caminos y Limpieza Energética"
                    className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-4 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Descripción Privada (Administrador)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Anotaciones internas sobre el altar, materiales necesarios, intenciones específicas..."
                    className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-4 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Precio / Ofrenda *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-[#9A9AB0] opacity-50" />
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="1500"
                      className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Moneda</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-4 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12"
                  >
                    <option value="MXN">MXN - Pesos Mexicanos</option>
                    <option value="USD">USD - Dólares Estadounidenses</option>
                    <option value="COP">COP - Pesos Colombianos</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Estado Inicial</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProcessStatus)}
                    className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-4 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="PAYMENT_RECEIVED">Pago Recibido</option>
                    <option value="PREPARATION">Preparación</option>
                    <option value="IN_PROGRESS">En Proceso</option>
                    <option value="SEALED">Sellado</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Prioridad de Conexión</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-4 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12"
                  >
                    <option value="LOW">Baja</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>



                <div className="space-y-2 md:col-span-2">
                  <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Mensaje de bienvenida personalizado (Para el consultante)</label>
                  <textarea
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder="Hola, te doy la bienvenida a tu espacio seguro de evolución espiritual. Estaremos cargando todos los avances en este canal..."
                    className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-4 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors min-h-[80px] resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[#2A2A38]">
                <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-[#9A9AB0] hover:text-[#C9A84C]">
                  Atrás
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold">
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Iniciar Proceso <Sparkles className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </motion.form>
          )}

          {step === 3 && createdProcess && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-2xl text-[#F5F3EE]">¡Canalización Registrada con Éxito!</h3>
                <p className="text-[#9A9AB0] text-sm max-w-md mx-auto">
                  El proceso de **{createdProcess.workName}** ha sido registrado en el Santuario. Aquí tienes el enlace exclusivo para que el consultante realice el seguimiento en tiempo real.
                </p>
              </div>

              {/* Enlace para compartir */}
              <div className="p-4 rounded-xl bg-[#0A0A0F]/80 border border-[#2A2A38] max-w-xl mx-auto flex items-center justify-between gap-4">
                <span className="text-[#C9A84C] text-xs font-mono overflow-x-auto whitespace-nowrap scrollbar-none flex-1 text-left px-2">
                  {getShareLink()}
                </span>
                <Button 
                  onClick={handleCopyLink}
                  className="bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/20 font-semibold text-xs py-1 h-10 shrink-0"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {isCopied ? "Copiado" : "Copiar Enlace"}
                </Button>
              </div>

              <div className="flex justify-center gap-4 pt-6 border-t border-[#2A2A38]">
                <Link href="/admin/procesos">
                  <Button variant="ghost" className="text-[#9A9AB0] hover:text-[#C9A84C]">
                    Ir a Procesos
                  </Button>
                </Link>
                <Link href={`/admin/procesos/${createdProcess.token}`}>
                  <Button className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold">
                    Ver Detalles
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
