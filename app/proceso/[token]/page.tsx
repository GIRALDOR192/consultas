"use client";

import { motion } from "framer-motion";
import { ChevronDown, Moon, Sparkles, Activity } from "lucide-react";

export default function ClientPortalHome() {
  // En la implementación real, estos datos vendrán del servidor vía token validation
  const progress = 35; 
  const statusLabel = "En Preparación Energética";
  const clientName = "Viajero";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full text-center space-y-16">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="space-y-6"
      >
        <h2 className="text-[#9A9AB0] font-mono text-xs tracking-[0.3em] uppercase">
          Bienvenido al Santuario, {clientName}
        </h2>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-[#F5F3EE] to-[#9A9AB0] tracking-tight leading-tight">
          Apertura de<br />Caminos
        </h1>
      </motion.div>

      {/* Círculo de Progreso Ritualístico */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center"
      >
        {/* Anillo exterior sutil */}
        <div className="absolute inset-0 rounded-full border border-[#2A2A38]/50"></div>
        
        {/* SVG Animado para el progreso */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle 
            cx="50%" 
            cy="50%" 
            r="48%" 
            className="fill-none stroke-[#2A2A38] stroke-[2px]"
          />
          <motion.circle 
            cx="50%" 
            cy="50%" 
            r="48%" 
            className="fill-none stroke-[#C9A84C] stroke-[2px]"
            strokeDasharray="300"
            initial={{ strokeDashoffset: 300 }}
            animate={{ strokeDashoffset: 300 - (300 * progress) / 100 }}
            transition={{ duration: 2, delay: 1, ease: "easeOut" }}
          />
        </svg>

        {/* Brillo interno si el progreso avanza */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#C9A84C]/5 to-[#3D2B6B]/5 backdrop-blur-md flex flex-col items-center justify-center border border-[#C9A84C]/10 shadow-[0_0_40px_rgba(201,168,76,0.05)]">
           <span className="font-serif text-4xl md:text-5xl text-[#F5F3EE] mb-1">{progress}%</span>
           <span className="text-[9px] font-mono text-[#C9A84C] tracking-[0.2em] uppercase">Evolución</span>
        </div>
      </motion.div>

      {/* Estado Actual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="glass-panel px-8 py-4 rounded-full border border-[#C9A84C]/20 flex items-center space-x-3"
      >
        <div className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse"></div>
        <span className="font-medium text-[#F5F3EE] tracking-wide text-sm md:text-base">
          {statusLabel}
        </span>
      </motion.div>

      {/* Accesos Rápidos */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="w-full max-w-md grid grid-cols-2 gap-4 mt-12"
      >
        <button className="glass-card p-6 flex flex-col items-center justify-center space-y-3 rounded-2xl group">
          <Moon className="w-6 h-6 text-[#9A9AB0] group-hover:text-[#C9A84C] transition-colors" />
          <span className="text-xs tracking-widest text-[#F5F3EE] uppercase font-mono">Bitácora</span>
        </button>
        <button className="glass-card p-6 flex flex-col items-center justify-center space-y-3 rounded-2xl group">
          <Sparkles className="w-6 h-6 text-[#9A9AB0] group-hover:text-[#C9A84C] transition-colors" />
          <span className="text-xs tracking-widest text-[#F5F3EE] uppercase font-mono">Línea de Tiempo</span>
        </button>
      </motion.div>

    </div>
  );
}
