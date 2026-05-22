"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Search, 
  Loader2, 
  Phone, 
  Mail, 
  Calendar,
  FolderOpen
} from "lucide-react";
import { getClients } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ClientItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  processesCount: number;
  createdAt: string;
}

export default function AdminClientesPage() {
  const [list, setList] = useState<ClientItem[]>([]);
  const [filteredList, setFilteredList] = useState<ClientItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadList() {
      try {
        const res = await getClients();
        setList(res as ClientItem[]);
        setFilteredList(res as ClientItem[]);
      } catch (err) {
        console.error("Error loading clients:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadList();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredList(list);
    } else {
      const lower = search.toLowerCase();
      setFilteredList(
        list.filter(
          c => 
            c.name.toLowerCase().includes(lower) || 
            (c.email && c.email.toLowerCase().includes(lower)) || 
            (c.phone && c.phone.includes(lower))
        )
      );
    }
  }, [search, list]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif tracking-wide text-[#F5F3EE]">Gestión de Consultantes</h1>
        <p className="text-[#9A9AB0] mt-1 text-sm tracking-wide">Administra las fichas de contacto e historial de tus consultantes.</p>
      </div>

      {/* Barra de Búsqueda */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-[#9A9AB0] opacity-50" />
        <input
          type="text"
          placeholder="Buscar consultante por nombre, correo o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#111118]/80 border border-[#2A2A38] rounded-xl pl-11 pr-4 py-3 text-sm text-[#F5F3EE] placeholder:text-[#9A9AB0]/40 focus:outline-none focus:border-[#C9A84C]/50 transition-colors h-12"
        />
      </div>

      {/* Listado */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
          <p className="text-[#9A9AB0] text-sm font-mono tracking-widest uppercase">Abriendo registros...</p>
        </div>
      ) : filteredList.length > 0 ? (
        <div className="glass-panel border border-[#2A2A38] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#2A2A38] bg-[#111118]/50 text-xs font-mono uppercase tracking-wider text-[#9A9AB0]">
                  <th className="p-4 pl-6">Nombre del Consultante</th>
                  <th className="p-4">Información de Contacto</th>
                  <th className="p-4 text-center">Procesos Registrados</th>
                  <th className="p-4 pr-6">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A38]/50">
                {filteredList.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    className="hover:bg-[#111118]/30 transition-colors group"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1A1A24] border border-[#2A2A38] flex items-center justify-center text-[#C9A84C] font-semibold text-sm">
                          {client.name.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-[#F5F3EE] font-serif text-base block group-hover:text-[#C9A84C] transition-colors">{client.name}</span>
                          <span className="text-[#9A9AB0] text-[10px] font-mono block">ID: {client.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-2 text-[#9A9AB0] text-xs">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-mono">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-[#9A9AB0] text-xs">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-mono">{client.phone}</span>
                        </div>
                      )}
                      {!client.email && !client.phone && (
                        <span className="text-[#9A9AB0]/50 text-xs italic">Sin contacto registrado</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-[#3D2B6B]/20 text-[#C9A84C] border border-[#C9A84C]/10 text-xs font-mono">
                        <FolderOpen className="w-3 h-3" />
                        <span>{client.processesCount}</span>
                      </div>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center gap-2 text-[#9A9AB0] font-mono text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{client.createdAt}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel text-center py-20 rounded-2xl">
          <Users className="w-12 h-12 text-[#9A9AB0]/30 mx-auto mb-4" />
          <h3 className="font-serif text-xl text-[#F5F3EE] mb-2">No se encontraron consultantes</h3>
          <p className="text-[#9A9AB0] text-sm max-w-sm mx-auto">
            {search 
              ? "Prueba cambiando los términos de tu búsqueda."
              : "Aún no se ha registrado ningún consultante. Se registrarán automáticamente cuando crees su primer proceso espiritual."}
          </p>
          {!search && (
            <Link href="/admin/procesos/nuevo" className="mt-6 inline-block">
              <Button className="bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold">
                Iniciar Primer Proceso
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
