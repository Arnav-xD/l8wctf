import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeAuthRedirect } from "../../../lib/ctf-auth";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const next = safeAuthRedirect(url.searchParams.get("next"));
  const supabase = await createClient();

  let error: Error | null = null;
  if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else {
    error = new Error("Missing confirmation token");
  }

  if (error) {
    return NextResponse.redirect(
      new URL("/weekly-ctfs/sign-in?error=invalid_or_expired_link", url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
