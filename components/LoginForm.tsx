"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type LoginFormProps = {
  credentialsEnabled?: boolean;
  googleEnabled?: boolean;
};

export function LoginForm({ credentialsEnabled = true, googleEnabled = false }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit() {
    if (!credentialsEnabled) {
      return;
    }

    if (!username.trim() || !password || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);

    const callbackUrl = searchParams.get("next") || "/chat";
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsPending(false);

    if (result?.error) {
      setError("Username ya password sahi nahi hai.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    if (!googleEnabled || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    const callbackUrl = searchParams.get("next") || "/chat";
    await signIn("google", { callbackUrl });
    setIsPending(false);
  }

  return (
    <div className="space-y-4">
      {googleEnabled ? (
        <button
          className="w-full rounded-xl border border-rule bg-paper2 py-3 text-[15px] text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending}
          onClick={() => void handleGoogleSignIn()}
          type="button"
        >
          Continue with Google
        </button>
      ) : null}
      {googleEnabled && credentialsEnabled ? (
        <div className="flex items-center gap-3 text-[12px] text-ink4">
          <div className="h-px flex-1 bg-rule" />
          <span>or</span>
          <div className="h-px flex-1 bg-rule" />
        </div>
      ) : null}
      {credentialsEnabled ? (
        <>
          <label className="block">
            <span className="mb-1.5 ml-1 block text-[12px] text-ink3">Username</span>
            <input
              autoComplete="username"
              className="w-full rounded-xl border border-rule bg-paper2 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink4 transition focus:border-teal"
              onChange={(event) => setUsername(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSubmit();
                }
              }}
              placeholder="username"
              required
              type="text"
              value={username}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 ml-1 block text-[12px] text-ink3">Password</span>
            <input
              autoComplete="current-password"
              className="w-full rounded-xl border border-rule bg-paper2 px-4 py-3 text-[15px] text-ink outline-none transition focus:border-teal"
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSubmit();
                }
              }}
              required
              type="password"
              value={password}
            />
          </label>
        </>
      ) : null}
      {error ? <p className="text-sm text-[#9a4d32]">{error}</p> : null}
      {credentialsEnabled ? (
        <button
          className="mt-2 w-full rounded-xl bg-teal py-3 text-[15px] font-medium text-paper transition hover:bg-tealDk active:bg-tealDk disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending || !username.trim() || !password}
          onClick={() => void handleSubmit()}
          type="button"
        >
          {isPending ? "Rukiye..." : "Sign in"}
        </button>
      ) : null}
    </div>
  );
}
