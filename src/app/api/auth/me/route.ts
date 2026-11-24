import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSystemConfigStatus } from "@/lib/db/supabase-client";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({
      user,
      system: getSystemConfigStatus(),
    });
  } catch (err) {
    console.error("Auth me error:", err);
    return NextResponse.json({ user: null, system: getSystemConfigStatus() });
  }
}
