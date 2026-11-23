"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, timingDummyHash, verifyPassword } from "@/lib/auth";

export type AuthState = { error?: string; email?: string } | undefined;

const credentials = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters for your password.").max(200),
});

function read(form: FormData) {
  return credentials.safeParse({ email: form.get("email"), password: form.get("password") });
}

export async function signUp(_state: AuthState, form: FormData): Promise<AuthState> {
  const parsed = read(form);
  const email = String(form.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  if (await db.user.findUnique({ where: { email: parsed.data.email } })) {
    return { error: "An account with this email already exists. Sign in instead.", email };
  }
  const user = await db.user.create({
    data: { email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) },
  });
  await createSession(user.id);
  redirect("/");
}

export async function signIn(_state: AuthState, form: FormData): Promise<AuthState> {
  const parsed = read(form);
  const email = String(form.get("email") ?? "");
  const failed = { error: "That email and password don’t match an account.", email };
  if (!parsed.success) return failed;

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await timingDummyHash()));
  if (!user || !valid) return failed;

  await createSession(user.id);
  redirect("/");
}

export async function signOut() {
  await destroySession();
  redirect("/login");
}
