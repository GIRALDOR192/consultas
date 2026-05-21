"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  BarChart, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Procesos", href: "/admin/procesos", icon: FolderOpen },
    { name: "Clientes", href: "/admin/clientes", icon: Users },
    { name: "Analítica", href: "/admin/analitica", icon: BarChart },
    { name: "Trabajadores", href: "/admin/trabajadores", icon: Settings },
  ];

  const handleLogout = async () => {
    // Para simplificar, simplemente borramos la cookie llamando al backend
    // o usando document.cookie
    document.cookie = "aura_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#2A2A38] glass-panel z-50">
        <div className="font-serif text-[#C9A84C] text-xl tracking-wide">AURA</div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-[#9A9AB0] hover:text-[#F5F3EE]"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Desktop / Mobile Overlay */}
      <AnimatePresence>
        {(isMobileMenuOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`
              fixed md:sticky top-0 left-0 h-screen w-64 border-r border-[#2A2A38] glass-panel z-40 flex flex-col
              ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
              transition-transform duration-300 md:transition-none
            `}
          >
            <div className="p-8 hidden md:block">
              <h2 className="font-serif text-[#C9A84C] text-2xl tracking-widest uppercase">Aura</h2>
              <p className="text-xs text-[#9A9AB0] tracking-widest font-mono mt-1">SANTUARIO</p>
            </div>

            <nav className="flex-1 px-4 py-8 md:py-0 space-y-2 mt-16 md:mt-0">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
                return (
                  <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <div className={`
                      flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300
                      ${isActive 
                        ? "bg-[#3D2B6B]/20 text-[#C9A84C] border border-[#C9A84C]/20 shadow-[0_0_15px_rgba(201,168,76,0.05)]" 
                        : "text-[#9A9AB0] hover:text-[#F5F3EE] hover:bg-[#1A1A24]"}
                    `}>
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium text-sm tracking-wide">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 mt-auto">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-[#9A9AB0] hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm tracking-wide">Desconectar</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#3D2B6B] opacity-[0.05] blur-[100px] pointer-events-none"></div>
        
        <div className="flex-1 p-6 md:p-10 relative z-10 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
