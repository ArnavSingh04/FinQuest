import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/auth-server";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createSupabaseMiddlewareClient(request, response);
    await supabase.auth.getUser();
  } catch {
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)"],
};
