import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/chat");
  }

  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
  const credentialsEnabled = (process.env.AUTH_ENABLE_CREDENTIALS_FALLBACK ?? "true").toLowerCase() !== "false";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative min-h-[760px] w-full max-w-[390px] overflow-hidden rounded-[30px] bg-paper text-ink shadow-[0_30px_80px_-35px_rgba(40,40,40,0.28)] sm:border sm:border-rule">
        <div className="px-7 pt-28">
          <div className="text-center">
            <div className="serif text-[44px] leading-none tracking-[-0.02em] text-ink">Lernsaathi</div>
            <div className="serif mt-3 text-[15px] italic text-ink3">Your private German companion.</div>
          </div>
          <div className="mt-16">
            <LoginForm credentialsEnabled={credentialsEnabled} googleEnabled={googleEnabled} />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-8 text-center">
          <div className="serif text-[12px] italic text-ink4">ek learner ke liye banaya gaya</div>
        </div>
      </div>
    </main>
  );
}
