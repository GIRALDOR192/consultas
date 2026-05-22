import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Proteger rutas del admin
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("aura_admin_session")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      // Token inválido o expirado
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("aura_admin_session");
      return response;
    }

    // Continuar (token válido)
    return NextResponse.next();
  }

  // 2. Proteger página de login (si ya tiene sesión, no debe verla)
  if (pathname === "/login") {
    const token = request.cookies.get("aura_admin_session")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
  }

  // 3. Rutas API (Auth)
  if (pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("aura_admin_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }
    // Añadir el userId a los headers para que la API route lo lea
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Headers de seguridad general (CSP básico, no index)
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Evitar indexado general
  if (pathname.startsWith("/proceso") || pathname.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, fonts (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
