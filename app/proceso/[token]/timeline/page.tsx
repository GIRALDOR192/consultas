"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Loader2,
  Activity,
  Sparkles,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { getClientProcessByToken } from "@/app/proceso/actions";

interface TimelineUpdate {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  uploads?: {
    id: string;
    fileName: string;
    url: string;
    mimeType: string;
  }[];
}

export default function TimelinePage() {
  const params = useParams();
  const token = params.token as string;

  const [updates, setUpdates] = useState<TimelineUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const proc = await getClientProcessByToken(token);
      if (proc) {
        setUpdates(proc.updates as unknown as TimelineUpdate[]);
      }
      setIsLoading(false);
    }
    load();
  }, [token]);

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
          <h1 className="font-serif text-2xl text-[#F5F3EE]">Línea de Tiempo</h1>
          <p className="text-[#9A9AB0] text-xs font-mono tracking-widest uppercase">Avances del proceso</p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" />
        </div>
      ) : updates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-10 rounded-2xl border border-[#2A2A38] text-center space-y-4"
        >
          <div className="w-14 h-14 rounded-full bg-[#C9A84C]/5 border border-[#C9A84C]/15 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-[#C9A84C]/40" />
          </div>
          <h3 className="font-serif text-lg text-[#F5F3EE]">El ritual comienza a tejerse</h3>
          <p className="text-[#9A9AB0] text-sm max-w-sm mx-auto leading-relaxed">
            Los avances de tu proceso espiritual aparecerán aquí a medida que tu guía vaya registrando cada etapa del camino.
          </p>
        </motion.div>
      ) : (
        <div className="relative pl-8 space-y-6">
          {/* Vertical line */}
          <div className="absolute left-3 top-3 bottom-3 w-px bg-gradient-to-b from-[#C9A84C]/40 via-[#3D2B6B]/30 to-transparent" />

          {updates.map((update, i) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative"
            >
              {/* Dot */}
              <div className="absolute -left-8 top-3 w-6 h-6 rounded-full bg-[#0A0A0F] border-2 border-[#C9A84C]/50 flex items-center justify-center shadow-[0_0_10px_rgba(201,168,76,0.2)]">
                <Activity className="w-3 h-3 text-[#C9A84C]" />
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-[#2A2A38] space-y-3 hover:border-[#C9A84C]/20 transition-colors">
                {update.title && (
                  <h3 className="font-serif text-[#F5F3EE] text-base">{update.title}</h3>
                )}
                <p className="text-[#9A9AB0] text-sm leading-relaxed">{update.content}</p>

                {update.uploads && update.uploads.length > 0 && (
                  <div className={`grid gap-2 mt-3 ${update.uploads.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {update.uploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#2A2A38] bg-[#0A0A0F] group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={upload.url}
                          alt={upload.fileName}
                          className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500"
                          onClick={() => window.open(upload.url, "_blank")}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <span className="text-[10px] font-mono text-[#C9A84C] uppercase tracking-wider bg-[#0A0A0F]/80 px-2 py-1 rounded border border-[#C9A84C]/35">Ver imagen</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[10px] text-[#9A9AB0]/60 font-mono pt-1">
                  <Clock className="w-3 h-3" />
                  <span>{update.createdAt}</span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Final glow */}
          <div className="absolute -left-2 bottom-0 w-10 h-10 rounded-full bg-[#3D2B6B]/20 blur-xl" />
        </div>
      )}
    </div>
  );
}
