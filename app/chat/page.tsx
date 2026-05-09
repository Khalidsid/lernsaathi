import { redirect } from "next/navigation";

import { ChatShell } from "@/components/ChatShell";
import { auth } from "@/lib/auth";
import { getRecentChatMessages } from "@/lib/chat-history";
import { db } from "@/lib/db";
import { getDueRevisionCards, getMistakeGroups } from "@/lib/revision-data";

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

  const [profile, initialMessages, revisionCards, mistakeGroups] = await Promise.all([
    db.learnerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        displayName: true,
        displayNamePromptCount: true,
      },
    }),
    getRecentChatMessages(session.user.id),
    getDueRevisionCards(session.user.id),
    getMistakeGroups(session.user.id),
  ]);

  const shouldPromptForName = Boolean(profile && !profile.displayName && profile.displayNamePromptCount < 2);

  const accountLabel = session.user.email ?? profile?.displayName ?? session.user.name ?? "Account";
  const account = {
    label: accountLabel,
    email: session.user.email ?? null,
  };

  return (
    <ChatShell
      account={account}
      activeTab={activeTab}
      initialMessages={initialMessages}
      mistakeGroups={mistakeGroups}
      revisionCards={revisionCards}
      shouldPromptForName={shouldPromptForName}
    />
  );
}
