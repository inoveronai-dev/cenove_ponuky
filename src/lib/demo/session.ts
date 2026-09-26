import { cookies } from "next/headers";
import {
  DEMO_SESSION_COOKIE,
  DEMO_USER_ID,
  isDemoMode,
} from "@/lib/demo/mode";

export async function getDemoSessionUserId(): Promise<string | null> {
  if (!isDemoMode()) return null;
  const cookieStore = await cookies();
  const value = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  return value === "1" || value === DEMO_USER_ID ? DEMO_USER_ID : null;
}

export async function setDemoSession() {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearDemoSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
}
