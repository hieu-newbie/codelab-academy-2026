import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/sqlite";
import { signSessionToken, verifySessionToken } from "@/lib/crypto";
import type { UserProfile } from "@/types/codelab";

export const SESSION_COOKIE_NAME = "codelab_session";

export async function getSessionUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const db = getDb();
  const row = db
    .prepare(`
      SELECT id, email, full_name, username, avatar_url, bio, role, xp, level, theme,
             preferred_language, total_study_minutes, bugs_fixed_count, created_at
      FROM profiles
      WHERE id = ?
    `)
    .get(payload.uid) as UserProfile | undefined;

  return row ?? null;
}

export async function requireUser(): Promise<
  { user: UserProfile; errorResponse: null } | { user: null; errorResponse: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Vui lòng đăng nhập để sử dụng chức năng này." },
        { status: 401 }
      ),
    };
  }
  return { user, errorResponse: null };
}

export async function requireAdmin(): Promise<
  { user: UserProfile; errorResponse: null } | { user: null; errorResponse: NextResponse }
> {
  const res = await requireUser();
  if (res.errorResponse || !res.user) return res;
  if (res.user.role !== "admin") {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Truy cập bị từ chối. Chỉ quản trị viên (Admin) mới có quyền thực hiện thao tác này." },
        { status: 403 }
      ),
    };
  }
  return { user: res.user, errorResponse: null };
}

function shouldUseSecureCookie(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim().startsWith("https://"));
}

export function attachSessionCookie(response: NextResponse, userId: string, role: "student" | "admin"): NextResponse {
  const token = signSessionToken({ uid: userId, role });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 0,
  });
  return response;
}
