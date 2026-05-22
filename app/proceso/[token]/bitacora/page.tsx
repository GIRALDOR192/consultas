"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sparkles,
  ChevronLeft,
  Loader2,
  BookOpen,
  Heart,
  Cloud,
  Zap,
  Star,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { addEmotionalLog, getEmotionalLogs } from "@/app/proceso/actions";

interface EmotionalLog {
  id: string;
  type: string;
  content: string;
  mood: number | null;
  logDate: string;
}

const moodEmojis = ["😔", "😟", "😕", "😐", "🙂", "😊", "😌", "✨", "🌟", "🌈"];

const logTypes = [
  { key: "emocion", label: "Emoción", icon: Heart, color: "text-pink-400" },
  { key: "sueno", label: "Sueño", icon: Moon, color: "text-[#A78BFA]" },
  { key: "cambio", label: "Cambio Percibido", icon: Zap, color: "text-[#C9A84C]" },
  { key: "experiencia", label: "Experiencia Espiritual", icon: Star, color: "text-emerald-400" },
  { key: "pensamiento", label: "Reflexión", icon: Cloud, color: "text-blue-400" },
];

export default function BitacoraPage() {
  const params = useParams();
  const token = params.token as string;

  const [logs, setLogs] = useState<EmotionalLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [selectedType, setSelectedType] = useState("emocion");
  const [mood, setMood] = useState(5);
  const [content, setContent] = useState("");

  useEffect(() => {
    async function load() {
      const data = await getEmotionalLogs(token);
      setLogs(data as EmotionalLog[]);
      setIsLoading(false);
    }
    load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Por favor escribe algo antes de guardar.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await addEmotionalLog(token, {
        type: selectedType,
        content: content.trim(),
        mood,
      });
      if (res.success) {
        toast.success("¡Registro guardado en tu bitácora!");
        setContent("");
        setMood(5);
        setSelectedType("emocion");
        setShowForm(false);
        // Reload logs
        const updated = await getEmotionalLogs(token);
        setLogs(updated as EmotionalLog[]);
      } else {
        toast.error(res.error || "Error al guardar.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeConfig = (key: string) =>
    logTypes.find((t) => t.key === key) ?? logTypes[0];

  return (
    <div className="w-full max-w-xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/proceso/${token}`}>
          <button className="w-10 h-10 rounded-full glass-panel border border-[#2A2A38] flex items-center justify-center text-[#9A9AB0] hover:text-[#C9A84C] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl text-[#F5F3EE]">Bitácora Espiritual</h1>
          <p className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Tu espacio de expresión</p>
        </div>
      </div>

      {/* Botón nuevo registro */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowForm(!showForm)}
        className="w-full py-4 rounded-2xl border border-dashed border-[#C9A84C]/30 bg-[#C9A84C]/3 hover:bg-[#C9A84C]/8 hover:border-[#C9A84C]/50 transition-all flex items-center justify-center gap-3 text-[#C9A84C] group"
      >
        {showForm ? (
          <><X className="w-4 h-4" /> Cancelar</>
        ) : (
          <><BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" /> <span className="text-sm font-medium">Registrar cómo me siento hoy</span></>
        )}
      </motion.button>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="glass-panel p-6 rounded-2xl border border-[#2A2A38] space-y-6"
          >
            {/* Tipo */}
            <div className="space-y-3">
              <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">
                Tipo de registro
              </label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {logTypes.map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedType(key)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all text-sm ${
                      selectedType === key
                        ? "border-[#C9A84C]/50 bg-[#C9A84C]/10 text-[#F5F3EE]"
                        : "border-[#2A2A38] text-[#9A9AB0] hover:border-[#C9A84C]/20"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mood slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">
                  ¿Cómo te sientes? ({mood}/10)
                </label>
                <span className="text-3xl">{moodEmojis[mood - 1]}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
                className="w-full accent-[#C9A84C] cursor-pointer h-1.5 bg-[#1A1A24] rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-[#9A9AB0] font-mono">
                <span>Difícil</span>
                <span>Neutro</span>
                <span>Excelente</span>
              </div>
            </div>

            {/* Texto libre */}
            <div className="space-y-2">
              <label className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">
                Cuéntame más...
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="Hoy me sentí... soñé con... noté que..."
                className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] rounded-xl px-4 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors min-h-[120px] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Send className="w-4 h-4" /> Guardar en mi bitácora</>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Historial de registros */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8 rounded-2xl border border-[#2A2A38] text-center space-y-4"
        >
          <Moon className="w-10 h-10 text-[#9A9AB0]/40 mx-auto" />
          <p className="text-[#9A9AB0] text-sm">
            Tu bitácora está en blanco. Cada registro que hagas quedará guardado aquí como parte de tu camino espiritual.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {logs.map((log, i) => {
            const tConf = typeConfig(log.type);
            const Icon = tConf.icon;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel p-5 rounded-2xl border border-[#2A2A38] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${tConf.color}`} />
                    <span className="text-xs font-mono text-[#9A9AB0] uppercase tracking-widest">
                      {tConf.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.mood !== null && (
                      <span className="text-lg">{moodEmojis[log.mood - 1]}</span>
                    )}
                    <span className="text-xs text-[#9A9AB0]">{log.logDate}</span>
                  </div>
                </div>
                <p className="text-[#F5F3EE] text-sm leading-relaxed">{log.content}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
