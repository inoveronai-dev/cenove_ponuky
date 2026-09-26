"use server";

import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo/mode";
import {
  clearDemoSession,
  setDemoSession,
} from "@/lib/demo/session";
import { readDemoStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";

export async function enterDemoMode() {
  await readDemoStore();
  await setDemoSession();
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  if (isDemoMode()) {
    await setDemoSession();
    redirect("/dashboard");
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();

  if (!email || !password) {
    return { error: "Zadajte e-mail a heslo." };
  }

  if (password.length < 6) {
    return { error: "Heslo musí mať aspoň 6 znakov." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || email.split("@")[0] },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  if (isDemoMode()) {
    await setDemoSession();
    redirect("/dashboard");
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Zadajte e-mail a heslo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Nesprávny e-mail alebo heslo." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  if (isDemoMode()) {
    await clearDemoSession();
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
