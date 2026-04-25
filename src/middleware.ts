import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const PUBLIC = ["/login", "/campo", "/manifest.json", "/icons"];
const REFRESH_AFTER_MS = 12 * 60 * 60 * 1000; // 12 horas
const SESSION_MAX_AGE = 60 * 60 * 24; // 1 dia em segundos

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET ausente ou muito curto (mínimo 32 chars).");
  }
  return new TextEncoder().encode(s);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/_") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // CSRF: bloqueia mutações sem Origin válido
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  const token = req.cookies.get("session")?.value;
  const isPublic = PUBLIC.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  let authed = false;
  let payload: Record<string, unknown> | null = null;

  if (token && process.env.AUTH_SECRET) {
    try {
      const result = await jwtVerify(token, secret());
      authed = true;
      payload = result.payload as Record<string, unknown>;
    } catch {
      authed = false;
    }
  }

  if (!authed && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (authed && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // X-Request-ID para rastreabilidade
  const requestId = crypto.randomUUID();
  response.headers.set("X-Request-ID", requestId);

  // Auto-refresh: se o token tem mais de 12h, emite um novo
  if (authed && payload?.iat) {
    const issuedAt = (payload.iat as number) * 1000;
    const age = Date.now() - issuedAt;

    if (age > REFRESH_AFTER_MS) {
      const newToken = await new SignJWT({
        sub: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string,
        role: payload.role as string,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(secret());

      response.cookies.set("session", newToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
