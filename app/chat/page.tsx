import { redirect } from "next/navigation";

import { ChatShell } from "@/components/ChatShell";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import type { ChatTab } from "@/components/TabBar";

export const dynamic = "force-dynamic";

type ChatPageProps = {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
};

function getActiveTab(value: string | string[] | undefined): ChatTab {
  const tab = Array.isArray(value) ? value[0] : value;

  if (tab === "revision" || tab === "mistakes") {
    return tab;
  }

  return "chat";
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const activeTab = getActiveTab(params?.tab);

  const profile = await db.learnerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      displayName: true,
      displayNamePromptCount: true,
    },
  });

  const shouldPromptForName = Boolean(profile && !profile.displayName && profile.displayNamePromptCount < 2);

  return <ChatShell activeTab={activeTab} shouldPromptForName={shouldPromptForName} />;
}
