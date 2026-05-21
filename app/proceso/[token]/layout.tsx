"use client";

import { motion } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F5F3EE] relative overflow-hidden flex flex-col items-center justify-center selection:bg-[#C9A84C]/30">
      
      {/* Background Cinematográfico */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Nebulosa principal */}
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-[#3D2B6B]/20 to-transparent blur-[120px]"
        />
        
        {/* Destello dorado */}
        <motion.div 
          animate={{ 
            opacity: [0.05, 0.1, 0.05],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tl from-[#C9A84C]/10 to-transparent blur-[100px]"
        />
        
        {/* Ruido sutil para textura */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>
      </div>

      {/* Header Minimalista */}
      <header className="fixed top-0 left-0 w-full p-6 md:p-10 flex justify-center z-50 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="font-serif text-[#C9A84C] text-xl md:text-2xl tracking-[0.2em] opacity-80"
        >
          AURA
        </motion.div>
      </header>

      {/* Contenido Principal */}
      <main className="w-full max-w-3xl px-6 py-24 relative z-10 flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer Minimalista */}
      <footer className="fixed bottom-0 left-0 w-full p-6 text-center z-50 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-[#9A9AB0]/40 text-[10px] font-mono tracking-widest uppercase"
        >
          Espacio Privado • Cifrado de Extremo a Extremo
        </motion.div>
      </footer>
      
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}
