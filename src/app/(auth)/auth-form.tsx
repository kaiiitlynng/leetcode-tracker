"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const [state, action, pending] = useActionState<AuthState, FormData>(isSignup ? signUp : signIn, undefined);

  return (
    <div className="auth">
      <h1 className="auth-title">{isSignup ? "Create your account" : "Sign in"}</h1>
      <p className="auth-lede">
        {isSignup ? "Your problems and attempts are private to your account." : "Pick up where you left off."}
      </p>
      <form className="form" action={action} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.email} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="password">
            Password {isSignup && <span className="hint">at least 8 characters</span>}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            required
          />
        </div>
        {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
        <button className="button auth-submit" type="submit" disabled={pending}>
          {pending ? (isSignup ? "Creating account…" : "Signing in…") : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>
      <p className="auth-switch">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link>
      </p>
    </div>
  );
}
