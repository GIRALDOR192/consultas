"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error de autenticación");
      }

      toast.success("Acceso concedido");
      router.push("/admin");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0F]">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#3D2B6B] opacity-[0.15] blur-[120px]"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#C9A84C] opacity-[0.08] blur-[120px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="glass-panel p-8 md:p-12 rounded-2xl relative overflow-hidden">
          {/* Brillo sutil superior */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C9A84C]/50 to-transparent"></div>
          
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#1A1A24] border border-[#2A2A38] flex items-center justify-center shadow-[0_0_30px_rgba(201,168,76,0.1)]">
              <Lock className="w-6 h-6 text-[#C9A84C]" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-serif text-[#F5F3EE] mb-2 tracking-wide">Acceso Privado</h1>
            <p className="text-[#9A9AB0] text-xs tracking-widest uppercase font-mono">Consultas y Ritualizaciones</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#9A9AB0] uppercase text-xs tracking-wider">
                Identificador
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aura.local"
                required
                className="bg-[#0A0A0F]/50 border-[#2A2A38] focus-visible:ring-[#C9A84C]/50 text-[#F5F3EE] placeholder:text-[#9A9AB0]/50 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#9A9AB0] uppercase text-xs tracking-wider">
                Credencial
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-[#0A0A0F]/50 border-[#2A2A38] focus-visible:ring-[#C9A84C]/50 text-[#F5F3EE] placeholder:text-[#9A9AB0]/50 h-12"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#C9A84C] hover:bg-[#F0D080] text-[#0A0A0F] font-semibold tracking-wide transition-all duration-300"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Entrar al Santuario"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
