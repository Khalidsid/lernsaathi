import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { ChatShell } from "@/components/ChatShell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await db.learnerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      displayName: true,
      displayNamePromptCount: true,
    },
  });

  const shouldPromptForName = Boolean(profile && !profile.displayName && profile.displayNamePromptCount < 2);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl px-3 py-3 sm:px-6 sm:py-6">
      <ChatShell
        appName={process.env.APP_NAME?.trim() || "Sprachhilfe"}
        shouldPromptForName={shouldPromptForName}
      />
    </main>
  );
}
