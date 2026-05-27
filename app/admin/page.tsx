"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Activity, 
  Sparkles, 
  Clock, 
  ArrowRight,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/app/admin/actions";

interface DashboardData {
  activeCount: number;
  completedCount: number;
  clientsCount: number;
  alertsCount: number;
  recentProcesses: Array<{
    id: string;
    workName: string;
    clientName: string;
    status: string;
    createdAt: string;
    unreadCount?: number;
  }>;
  quickFollowups: Array<{
    id: string;
    workName: string;
    clientName: string;
    status: string;
    progressPercent: number;
    unreadCount?: number;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getDashboardStats();
        setData(stats);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin" />
        <p className="text-[#9A9AB0] text-sm font-mono tracking-widest uppercase">Canalizando energías...</p>
      </div>
    );
  }

  const activeStats = [
    {
      title: "Procesos Activos",
      value: data?.activeCount ?? 0,
      description: "Trabajos en evolución",
      icon: Activity,
      color: "text-[#C9A84C]",
    },
    {
      title: "Finalizados",
      value: data?.completedCount ?? 0,
      description: "Rituales sellados",
      icon: Sparkles,
      color: "text-[#6B4FA0]",
    },
    {
      title: "Clientes",
      value: data?.clientsCount ?? 0,
      description: "Total registrados",
      icon: Users,
      color: "text-[#F5F3EE]",
    },
    {
      title: "Alertas",
      value: data?.alertsCount ?? 0,
      description: "Requieren atención",
      icon: Clock,
      color: (data?.alertsCount ?? 0) > 0 ? "text-red-400" : "text-[#9A9AB0] opacity-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-wide text-[#F5F3EE]">Santuario</h1>
          <p className="text-[#9A9AB0] mt-1 text-sm tracking-wide">Visión general de procesos and energía activa.</p>
        </div>
        <Link href="/admin/procesos/nuevo">
          <Button className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold tracking-wide">
            <Sparkles className="w-4 h-4 mr-2" />
            Nuevo Proceso
          </Button>
        </Link>
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="glass-card border-none shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#9A9AB0] uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color} opacity-80`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif text-[#F5F3EE]">{stat.value}</div>
                <p className="text-xs text-[#9A9AB0] mt-1 tracking-wide">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Actividad Reciente */}
        <motion.div 
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl tracking-wide text-[#C9A84C]">Actividad Reciente</h2>
              <Link href="/admin/procesos">
                <Button variant="ghost" className="text-[#9A9AB0] hover:text-[#C9A84C] text-xs uppercase tracking-wider">
                  Ver todo <ArrowRight className="w-3 h-3 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-6">
              {data?.recentProcesses && data.recentProcesses.length > 0 ? (
                data.recentProcesses.map((p, i) => (
                  <div key={p.id} className="flex items-start gap-4 pb-6 border-b border-[#2A2A38] last:border-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-[#1A1A24] border border-[#2A2A38] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[#F5F3EE] text-sm font-medium tracking-wide flex items-center gap-2">
                        {p.workName}
                        {p.unreadCount && p.unreadCount > 0 ? (
                          <span className="text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded border border-red-500/25 bg-red-500/10 text-red-400 font-semibold animate-pulse flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-red-400"></span> Novedad ({p.unreadCount})
                          </span>
                        ) : null}
                      </h4>
                      <p className="text-[#9A9AB0] text-sm mt-1">
                        Cliente: <span className="text-[#F5F3EE] font-medium">{p.clientName}</span>. Estado: {p.status}.
                      </p>
                      <span className="text-xs text-[#6B4FA0] font-mono tracking-widest mt-2 block uppercase">
                        CREADO EL {p.createdAt}
                      </span>
                    </div>
                    <Link href={`/admin/procesos/${p.id}`}>
                      <Button variant="outline" size="sm" className="border-[#2A2A38] hover:bg-[#1A1A24] text-[#9A9AB0] hover:text-[#C9A84C]">
                        Gestionar
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Sparkles className="w-8 h-8 text-[#9A9AB0]/30 mx-auto mb-3" />
                  <p className="text-[#9A9AB0] text-sm">No hay actividades registradas aún.</p>
                  <Link href="/admin/procesos/nuevo" className="mt-4 inline-block">
                    <Button variant="outline" size="sm" className="border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10">
                      Crear primer proceso
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Seguimiento Rápido */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
             {/* Adorno visual */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#3D2B6B] rounded-full blur-[50px] opacity-20"></div>
             
             <h2 className="font-serif text-xl tracking-wide text-[#F5F3EE] mb-6">Seguimiento Rápido</h2>
             
             <div className="space-y-4">
                {data?.quickFollowups && data.quickFollowups.length > 0 ? (
                  data.quickFollowups.map((item) => (
                    <Link href={`/admin/procesos/${item.id}`} key={item.id} className="block">
                      <div className="p-4 rounded-xl bg-[#111118] border border-[#2A2A38] hover:border-[#C9A84C]/30 transition-all cursor-pointer">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-mono tracking-widest inline-block px-2 py-0.5 rounded border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]">
                              {item.status}
                            </span>
                            {item.unreadCount && item.unreadCount > 0 ? (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title={`Nueva actividad (${item.unreadCount})`} />
                            ) : null}
                          </div>
                          <span className="text-xs font-mono text-[#9A9AB0]">{item.progressPercent}%</span>
                        </div>
                        <h4 className="text-[#F5F3EE] text-sm tracking-wide font-medium">{item.workName}</h4>
                        <p className="text-[#9A9AB0] text-xs mt-1">Cliente: {item.clientName}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed border-[#2A2A38] rounded-xl">
                    <p className="text-[#9A9AB0] text-xs">Sin procesos activos</p>
                  </div>
                )}
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
