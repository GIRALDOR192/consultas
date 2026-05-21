import { redirect } from "next/navigation";

export default function Home() {
  // En un sistema 100% privado, la raíz redirige al panel admin
  redirect("/login");
}
