"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Activity, 
  Sparkles, 
  Clock, 
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const stats = [
  {
    title: "Procesos Activos",
    value: "12",
    description: "+2 esta semana",
    icon: Activity,
    color: "text-[#C9A84C]",
  },
  {
    title: "Finalizados",
    value: "148",
    description: "Este año",
    icon: Sparkles,
    color: "text-[#6B4FA0]",
  },
  {
    title: "Clientes",
    value: "84",
    description: "Total registrados",
    icon: Users,
    color: "text-[#F5F3EE]",
  },
  {
    title: "Alertas",
    value: "3",
    description: "Requieren atención",
    icon: Clock,
    color: "text-red-400",
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-wide text-[#F5F3EE]">Santuario</h1>
          <p className="text-[#9A9AB0] mt-1 text-sm tracking-wide">Visión general de procesos y energía activa.</p>
        </div>
        <Link href="/admin/procesos/nuevo">
          <Button className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold tracking-wide">
            <Sparkles className="w-4 h-4 mr-2" />
            Nuevo Proceso
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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
        <motion.div 
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl tracking-wide text-[#C9A84C]">Actividad Reciente</h2>
              <Button variant="ghost" className="text-[#9A9AB0] hover:text-[#C9A84C] text-xs uppercase tracking-wider">
                Ver todo <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 pb-6 border-b border-[#2A2A38] last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A24] border border-[#2A2A38] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                  </div>
                  <div>
                    <h4 className="text-[#F5F3EE] text-sm font-medium tracking-wide">Actualización de Proceso</h4>
                    <p className="text-[#9A9AB0] text-sm mt-1">Se ha completado la fase de preparación para el cliente ID #{2400 + i}.</p>
                    <span className="text-xs text-[#6B4FA0] font-mono tracking-widest mt-2 block">HACE {i} HORAS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

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
                {[
                  { state: "PREPARACIÓN", name: "Limpieza Energética", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
                  { state: "EN PROCESO", name: "Apertura de Caminos", color: "bg-green-500/20 text-green-400 border-green-500/30" },
                  { state: "SELLADO", name: "Protección Áurica", color: "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30" },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#111118] border border-[#2A2A38] hover:border-[#C9A84C]/30 transition-colors cursor-pointer">
                    <div className={`text-[10px] uppercase font-mono tracking-widest inline-block px-2 py-1 rounded border ${item.color} mb-2`}>
                      {item.state}
                    </div>
                    <h4 className="text-[#F5F3EE] text-sm tracking-wide">{item.name}</h4>
                  </div>
                ))}
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
