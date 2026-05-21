"use client";

import { motion } from "framer-motion";
import { Plus, Image as ImageIcon, FileText, Video, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const timelineData = [
  {
    id: 1,
    date: "21 de Mayo, 2026",
    title: "Preparación de Elementos",
    content: "Se han preparado las velas, hierbas y elementos requeridos para el altar. La canalización fue exitosa.",
    type: "update",
    media: 2
  },
  {
    id: 2,
    date: "19 de Mayo, 2026",
    title: "Pago y Formulario Recibido",
    content: "El cliente ha completado la intención del ritual. Se adjunta el comprobante.",
    type: "system",
    media: 1
  }
];

export default function AdminTimelinePage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2A2A38] pb-6">
        <div>
          <h1 className="text-2xl font-serif text-[#F5F3EE]">Bitácora y Timeline</h1>
          <p className="text-[#9A9AB0] text-sm mt-1">Registra los avances de este trabajo espiritual.</p>
        </div>
      </div>

      {/* Editor de Nueva Actualización */}
      <div className="glass-panel p-6 rounded-2xl border border-[#C9A84C]/20 shadow-[0_0_30px_rgba(201,168,76,0.03)] space-y-4">
        <h3 className="text-sm font-medium text-[#F5F3EE] tracking-wide uppercase font-mono">Nueva Actualización</h3>
        
        <input 
          placeholder="Título (opcional)" 
          className="w-full bg-transparent border-b border-[#2A2A38] pb-2 text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 text-lg font-serif"
        />
        
        <textarea 
          placeholder="Escribe el avance, visiones, o resultados de la sesión..." 
          className="w-full bg-[#0A0A0F]/50 border border-[#2A2A38] text-[#F5F3EE] rounded-lg p-4 min-h-[120px] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 resize-none text-sm leading-relaxed"
        />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-2">
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" className="border-[#2A2A38] text-[#9A9AB0] hover:text-[#C9A84C] hover:bg-[#1A1A24]">
              <ImageIcon className="w-4 h-4 mr-2" /> Foto
            </Button>
            <Button variant="outline" size="sm" className="border-[#2A2A38] text-[#9A9AB0] hover:text-[#C9A84C] hover:bg-[#1A1A24]">
              <Video className="w-4 h-4 mr-2" /> Video
            </Button>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center text-xs text-[#9A9AB0]">
              <Lock className="w-3 h-3 mr-1" /> Visible al cliente
            </div>
            <Button className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline Feed */}
      <div className="relative pl-6 md:pl-8 space-y-10 pt-4 before:absolute before:inset-0 before:ml-6 md:before:ml-8 before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#C9A84C]/50 before:to-[#2A2A38]">
        {timelineData.map((item, index) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative"
          >
            {/* Punto de la línea de tiempo */}
            <div className={`absolute -left-8 md:-left-10 mt-1.5 w-4 h-4 rounded-full border-4 border-[#0A0A0F] ${item.type === 'system' ? 'bg-[#3D2B6B]' : 'bg-[#C9A84C]'}`}></div>
            
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
                <h4 className="font-serif text-lg text-[#F5F3EE] tracking-wide">{item.title}</h4>
                <span className="text-[10px] uppercase tracking-widest font-mono text-[#9A9AB0] bg-[#1A1A24] px-2 py-1 rounded">
                  {item.date}
                </span>
              </div>
              
              <p className="text-[#9A9AB0] text-sm leading-relaxed mb-4">
                {item.content}
              </p>

              {item.media > 0 && (
                <div className="flex gap-2">
                  <div className="flex items-center text-xs text-[#6B4FA0] bg-[#3D2B6B]/20 px-3 py-1.5 rounded-lg border border-[#3D2B6B]/30">
                    <ImageIcon className="w-3 h-3 mr-2" />
                    {item.media} Archivos adjuntos
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
