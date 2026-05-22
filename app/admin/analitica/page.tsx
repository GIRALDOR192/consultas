"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Sparkles, 
  Clock, 
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/app/admin/actions";

interface StatsData {
  activeCount: number;
  completedCount: number;
  clientsCount: number;
}

export default function AdminAnaliticaPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getDashboardStats();
        setStats(res);
      } catch (err) {
        console.error(err);
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
        <p className="text-[#9A9AB0] text-sm font-mono tracking-widest uppercase">Alineando constelaciones...</p>
      </div>
    );
  }

  const activeCount = stats?.activeCount ?? 0;
  const completedCount = stats?.completedCount ?? 0;
  const totalCount = activeCount + completedCount;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif tracking-wide text-[#F5F3EE]">Analítica y Flujos</h1>
        <p className="text-[#9A9AB0] mt-1 text-sm tracking-wide">Métricas de evolución y valor de los servicios espirituales.</p>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="glass-card border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#9A9AB0] uppercase tracking-wider">
                Eficiencia de Cierre
              </CardTitle>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif text-[#F5F3EE]">{completionRate}%</div>
              <p className="text-xs text-[#9A9AB0] mt-1 tracking-wide">
                Porcentaje de rituales completados exitosamente.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="glass-card border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#9A9AB0] uppercase tracking-wider">
                Flujo de Rituales
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-[#C9A84C] opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif text-[#F5F3EE]">{totalCount}</div>
              <p className="text-xs text-[#9A9AB0] mt-1 tracking-wide">
                Total de procesos iniciados históricamente.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="glass-card border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#9A9AB0] uppercase tracking-wider">
                Valor del Santuario
              </CardTitle>
              <DollarSign className="w-5 h-5 text-[#6B4FA0] opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif text-[#F5F3EE]">Premium</div>
              <p className="text-xs text-[#9A9AB0] mt-1 tracking-wide">
                Servicios personalizados exclusivos.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Reporte de evolución */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="glass-panel p-6 rounded-2xl border border-[#2A2A38]"
      >
        <h3 className="font-serif text-xl text-[#F5F3EE] mb-6">Resumen Espiritual y Frecuencia</h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#9A9AB0]">Procesos en Evolución Activa</span>
              <span className="text-[#F5F3EE] font-mono font-medium">{activeCount}</span>
            </div>
            <div className="w-full h-2 bg-[#1A1A24] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#C9A84C] rounded-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (activeCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#9A9AB0]">Procesos Sellados y Finalizados</span>
              <span className="text-[#F5F3EE] font-mono font-medium">{completedCount}</span>
            </div>
            <div className="w-full h-2 bg-[#1A1A24] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#6B4FA0] rounded-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
