import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedClaims() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return data.claims;
}

export type AuthenticatedClaims = NonNullable<Awaited<ReturnType<typeof getAuthenticatedClaims>>>;

export async function requireUser(): Promise<AuthenticatedClaims> {
  const claims = await getAuthenticatedClaims();

  if (!claims) {
    redirect("/login");
  }

  return claims;
}

export function withAuthenticatedRoute<TRequest extends Request, TArgs extends unknown[]>(
  handler: (request: TRequest, claims: AuthenticatedClaims, ...args: TArgs) => Promise<Response>,
) {
  return async function authenticatedRoute(request: TRequest, ...args: TArgs): Promise<Response> {
    const claims = await getAuthenticatedClaims();

    if (!claims) {
      return Response.json({ error: "未登录或登录状态已失效。" }, { status: 401 });
    }

    return handler(request, claims, ...args);
  };
}
