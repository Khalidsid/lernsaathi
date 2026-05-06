"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const callbackUrl = searchParams.get("next") || "/";
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

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm text-muted">Username</span>
        <input
          autoComplete="username"
          className="w-full rounded-2xl border border-border bg-surface-strong px-4 py-3 text-sm text-ink outline-none ring-0 transition focus:border-accent"
          onChange={(event) => setUsername(event.target.value)}
          required
          type="text"
          value={username}
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm text-muted">Password</span>
        <input
          autoComplete="current-password"
          className="w-full rounded-2xl border border-border bg-surface-strong px-4 py-3 text-sm text-ink outline-none ring-0 transition focus:border-accent"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {error ? <p className="text-sm text-[#9a4d32]">{error}</p> : null}
      <button
        className="inline-flex w-full items-center justify-center rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-[#3a3024] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Rukiye..." : "Login karein"}
      </button>
    </form>
  );
}
