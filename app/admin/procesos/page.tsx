"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Search, 
  Filter,
  Plus,
  Loader2,
  FolderOpen,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getProcesses } from "@/app/admin/actions";
import { ProcessStatus } from "@prisma/client";

interface ProcessItem {
  id: string;
  token: string;
  workName: string;
  clientName: string;
  status: ProcessStatus;
  priority: string;
  progressPercent: number;
  createdAt: string;
  unreadCount?: number;
}

export default function AdminProcesosPage() {
  const [list, setList] = useState<ProcessItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    async function loadList() {
      setIsLoading(true);
      try {
        const res = await getProcesses(search, statusFilter || undefined);
        setList(res as ProcessItem[]);
      } catch (err) {
        console.error("Error loading processes:", err);
      } finally {
        setIsLoading(false);
      }
    }
    const delayDebounce = setTimeout(() => {
      loadList();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const getStatusBadge = (status: ProcessStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "PAYMENT_RECEIVED":
        return "bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20";
      case "PREPARATION":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "IN_PROGRESS":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "SEALED":
        return "bg-amber-500/20 text-[#C9A84C] border-[#C9A84C]/40 animate-pulse";
      case "COMPLETED":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "PAUSED":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const statusLabels: Record<ProcessStatus, string> = {
    PENDING: "Pendiente",
    PAYMENT_RECEIVED: "Pago Recibido",
    PREPARATION: "Preparación",
    IN_PROGRESS: "En Proceso",
    SEALED: "Sellado",
    COMPLETED: "Completado",
    PAUSED: "Pausado",
    CANCELLED: "Cancelado",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-wide text-[#F5F3EE]">Procesos y Rituales</h1>
          <p className="text-[#9A9AB0] mt-1 text-sm tracking-wide">Gestiona los seguimientos energéticos de tus consultantes.</p>
        </div>
        <Link href="/admin/procesos/nuevo">
          <Button className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold tracking-wide">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proceso
          </Button>
        </Link>
      </div>

      {/* Controles de Búsqueda y Filtro */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-[#9A9AB0] opacity-50" />
          <input
            type="text"
            placeholder="Buscar por trabajo o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111118]/80 border border-[#2A2A38] rounded-xl pl-11 pr-4 py-3 text-sm text-[#F5F3EE] placeholder:text-[#9A9AB0]/40 focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12"
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-[#9A9AB0] opacity-50 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#111118]/80 border border-[#2A2A38] rounded-xl pl-11 pr-10 py-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12 appearance-none cursor-pointer"
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado de Procesos */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
          <p className="text-[#9A9AB0] text-sm font-mono tracking-widest uppercase">Leyendo alineaciones...</p>
        </div>
      ) : list.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="glass-card rounded-2xl p-6 border border-[#2A2A38] hover:border-[#C9A84C]/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-[10px] font-mono tracking-widest uppercase px-2 py-1 rounded border ${getStatusBadge(p.status)}`}>
                      {statusLabels[p.status] || p.status}
                    </span>
                    {p.unreadCount && p.unreadCount > 0 ? (
                      <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-1 rounded border border-red-500/25 bg-red-500/10 text-red-400 font-semibold animate-pulse flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-400"></span> Novedad ({p.unreadCount})
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-[#9A9AB0]">
                    #{p.token.substring(0, 6).toUpperCase()}
                  </span>
                </div>

                <h3 className="font-serif text-xl text-[#F5F3EE] tracking-wide mb-1 leading-snug">
                  {p.workName}
                </h3>
                <p className="text-[#9A9AB0] text-sm mb-6">
                  Cliente: <span className="text-[#F5F3EE]">{p.clientName}</span>
                </p>

                {/* Progreso */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#9A9AB0]">EVOLUCIÓN</span>
                    <span className="text-[#C9A84C] font-semibold">{p.progressPercent}%</span>
                  </div>
                  <div className="w-full h-1 bg-[#1A1A24] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#C9A84C] rounded-full transition-all duration-500"
                      style={{ width: `${p.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2A2A38] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#9A9AB0] uppercase tracking-wider">
                  CREADO {p.createdAt}
                </span>
                
                <div className="flex gap-2">
                  <Link href={`/admin/procesos/${p.id}`}>
                    <Button size="sm" className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold text-xs py-1 h-8">
                      Gestionar
                    </Button>
                  </Link>
                  <Link href={`/proceso/${p.token}`} target="_blank">
                    <Button variant="outline" size="sm" className="border-[#2A2A38] text-[#9A9AB0] hover:text-[#C9A84C] h-8 w-8 p-0 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-panel text-center py-20 rounded-2xl">
          <FolderOpen className="w-12 h-12 text-[#9A9AB0]/30 mx-auto mb-4" />
          <h3 className="font-serif text-xl text-[#F5F3EE] mb-2">No se encontraron procesos</h3>
          <p className="text-[#9A9AB0] text-sm max-w-sm mx-auto">
            {search || statusFilter 
              ? "Prueba cambiando los criterios de búsqueda o eliminando los filtros aplicados."
              : "Registra tu primer seguimiento espiritual para que aparezca en este panel administrativo."}
          </p>
          {!search && !statusFilter && (
            <Link href="/admin/procesos/nuevo" className="mt-6 inline-block">
              <Button className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold">
                <Plus className="w-4 h-4 mr-2" /> Registrar Proceso
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
