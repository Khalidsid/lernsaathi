import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-shell border border-border bg-surface p-8 shadow-soft backdrop-blur">
        <p className="font-display text-3xl text-ink">Sprachhilfe</p>
        <p className="mt-3 text-sm leading-6 text-muted">
          Login karein. Is jagah par aap German word ya phrase ka matlab pooch sakte hain.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
