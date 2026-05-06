import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function getDayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default async function AdminStatsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, totalEvents, eventsToday] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        loginCount: true,
        firstLoginAt: true,
        lastLoginAt: true,
      },
    }),
    db.learningEvent.count({
      where: { userId: session.user.id },
    }),
    db.learningEvent.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: getDayStart(),
        },
      },
    }),
  ]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10">
      <div className="rounded-shell border border-border bg-surface p-6 shadow-soft">
        <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-ink">
          {JSON.stringify(
            {
              loginCount: user?.loginCount ?? 0,
              firstLoginAt: user?.firstLoginAt,
              lastLoginAt: user?.lastLoginAt,
              totalEvents,
              eventsToday,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </main>
  );
}
