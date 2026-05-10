"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type LoginFormProps = {
  credentialsEnabled: boolean;
  emailRegistrationEnabled: boolean;
  googleEnabled: boolean;
};

function getHelperText(googleEnabled: boolean, credentialsEnabled: boolean): string {
  if (googleEnabled && credentialsEnabled) {
    return "Use Google if your email is allowlisted, or use temporary credentials.";
  }
  if (googleEnabled && !credentialsEnabled) {
    return "Use your allowlisted Google account to continue.";
  }
  if (!googleEnabled && credentialsEnabled) {
    return "Google sign-in is not configured here. Use temporary credentials.";
  }
  return "No sign-in method is configured. Set Google OAuth credentials or enable the credentials fallback.";
}

export function LoginForm({ credentialsEnabled, emailRegistrationEnabled, googleEnabled }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSignIn() {
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
      setError("Incorrect username or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function handleRegister() {
    if (!emailRegistrationEnabled) {
      return;
    }

    if (!email.trim() || !password || !confirmPassword || isPending) {
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setIsPending(false);
        setError(data.message || "Could not create account. Please try again.");
        return;
      }

      // Registration successful, now sign in
      const callbackUrl = searchParams.get("next") || "/chat";
      const result = await signIn("credentials", {
        username: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      setIsPending(false);

      if (result?.error) {
        setError("Account created. Sign in with your email and password.");
        setMode("signin");
        setUsername(email.trim());
        setPassword("");
        setEmail("");
        setConfirmPassword("");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setIsPending(false);
      setError("Could not create account. Please try again.");
    }
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

  const helperText = getHelperText(googleEnabled, credentialsEnabled);
  const noMethodsAvailable = !googleEnabled && !credentialsEnabled;

  if (noMethodsAvailable) {
    return (
      <div role="alert" className="rounded-xl border border-rule bg-paper2 px-4 py-3 text-[14px] text-ink2">
        {helperText}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-ink3">
        {helperText}
      </p>
      {googleEnabled ? (
        <button
          className="w-full rounded-xl border border-rule bg-paper2 py-3 text-[15px] text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending}
          onClick={() => void handleGoogleSignIn()}
          type="button"
        >
          {isPending ? "Redirecting..." : "Continue with Google"}
        </button>
      ) : null}
      {googleEnabled && (credentialsEnabled || emailRegistrationEnabled) ? (
        <div className="flex items-center gap-3 text-[12px] text-ink4">
          <div className="h-px flex-1 bg-rule" />
          <span>or</span>
          <div className="h-px flex-1 bg-rule" />
        </div>
      ) : null}
      {mode === "signin" && credentialsEnabled ? (
        <>
          <label className="block">
            <span className="mb-1.5 ml-1 block text-[12px] text-ink3">Username</span>
            <input
              autoComplete="username"
              className="w-full rounded-xl border border-rule bg-paper2 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink4 transition focus:border-teal"
              onChange={(event) => setUsername(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSignIn();
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
                  void handleSignIn();
                }
              }}
              required
              type="password"
              value={password}
            />
          </label>
        </>
      ) : null}
      {mode === "register" && emailRegistrationEnabled ? (
        <>
          <label className="block">
            <span className="mb-1.5 ml-1 block text-[12px] text-ink3">Email</span>
            <input
              autoComplete="email"
              className="w-full rounded-xl border border-rule bg-paper2 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink4 transition focus:border-teal"
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleRegister();
                }
              }}
              placeholder="email@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 ml-1 block text-[12px] text-ink3">Password</span>
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-rule bg-paper2 px-4 py-3 text-[15px] text-ink outline-none transition focus:border-teal"
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleRegister();
                }
              }}
              required
              type="password"
              value={password}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 ml-1 block text-[12px] text-ink3">Confirm Password</span>
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-rule bg-paper2 px-4 py-3 text-[15px] text-ink outline-none transition focus:border-teal"
              onChange={(event) => setConfirmPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleRegister();
                }
              }}
              required
              type="password"
              value={confirmPassword}
            />
          </label>
          {password && confirmPassword && password !== confirmPassword ? (
            <p className="text-[13px] text-[#9a4d32]">Passwords do not match.</p>
          ) : null}
        </>
      ) : null}
      {error ? <p className="text-sm text-[#9a4d32]" role="alert">{error}</p> : null}
      {mode === "signin" && credentialsEnabled ? (
        <button
          className="mt-2 w-full rounded-xl bg-teal py-3 text-[15px] font-medium text-paper transition hover:bg-tealDk active:bg-tealDk disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending || !username.trim() || !password}
          onClick={() => void handleSignIn()}
          type="button"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      ) : null}
      {mode === "register" && emailRegistrationEnabled ? (
        <button
          className="mt-2 w-full rounded-xl bg-teal py-3 text-[15px] font-medium text-paper transition hover:bg-tealDk active:bg-tealDk disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending || !email.trim() || !password || !confirmPassword || password !== confirmPassword}
          onClick={() => void handleRegister()}
          type="button"
        >
          {isPending ? "Creating account..." : "Create account"}
        </button>
      ) : null}
      {emailRegistrationEnabled && credentialsEnabled ? (
        <div className="text-center">
          {mode === "signin" ? (
            <button
              className="text-[13px] text-ink3 underline transition hover:text-ink2"
              onClick={() => {
                setMode("register");
                setError(null);
                setUsername("");
                setPassword("");
              }}
              type="button"
            >
              Create an email account
            </button>
          ) : (
            <button
              className="text-[13px] text-ink3 underline transition hover:text-ink2"
              onClick={() => {
                setMode("signin");
                setError(null);
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }}
              type="button"
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
