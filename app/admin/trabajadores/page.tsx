"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  ShieldAlert, 
  UserCheck, 
  Mail, 
  Clock, 
  Loader2,
  Settings
} from "lucide-react";
import { getWorkers } from "@/app/admin/actions";

interface WorkerItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: string;
}

export default function AdminTrabajadoresPage() {
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWorkers() {
      try {
        const res = await getWorkers();
        setWorkers(res as WorkerItem[]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkers();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif tracking-wide text-[#F5F3EE]">Trabajadores del Santuario</h1>
        <p className="text-[#9A9AB0] mt-1 text-sm tracking-wide">Administra los roles y permisos de acceso para operadores y asistentes.</p>
      </div>

      {/* Listado */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
          <p className="text-[#9A9AB0] text-sm font-mono tracking-widest uppercase">Consultando oráculos...</p>
        </div>
      ) : workers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map((w, index) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="glass-card rounded-2xl p-6 border border-[#2A2A38] hover:border-[#C9A84C]/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <span className={`text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded border ${
                    w.role === 'ADMIN' ? 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20' : 'bg-[#3D2B6B]/20 text-[#6B4FA0] border-[#3D2B6B]/30'
                  }`}>
                    {w.role}
                  </span>
                  
                  <span className="flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase text-emerald-400">
                    <UserCheck className="w-3.5 h-3.5" /> Activo
                  </span>
                </div>

                <h3 className="font-serif text-xl text-[#F5F3EE] tracking-wide mb-1 leading-snug">
                  {w.name}
                </h3>
                
                <div className="space-y-2 mt-4 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#9A9AB0]">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>{w.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#9A9AB0]">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Sesión: {w.lastLogin}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-[#2A2A38] flex items-center justify-between text-[10px] font-mono text-[#9A9AB0]">
                <span>PERMISOS TOTALES</span>
                <Settings className="w-4 h-4 text-[#9A9AB0] opacity-50" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-panel text-center py-20 rounded-2xl">
          <ShieldAlert className="w-12 h-12 text-[#9A9AB0]/30 mx-auto mb-4" />
          <h3 className="font-serif text-xl text-[#F5F3EE] mb-2">Sin trabajadores</h3>
          <p className="text-[#9A9AB0] text-sm max-w-sm mx-auto">
            No hay otros operadores registrados en el Santuario.
          </p>
        </div>
      )}
    </div>
  );
}
