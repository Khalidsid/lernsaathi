import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { AdminStatCard } from "@/components/AdminStatCard";

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

  const recentEvents = await db.learningEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      inputType: true,
      learnerVisibleLabel: true,
      rawInput: true,
    },
    take: 8,
  });

  const stats = {
    loginCount: user?.loginCount ?? 0,
    firstLoginAt: user?.firstLoginAt,
    lastLoginAt: user?.lastLoginAt,
    totalEvents,
    eventsToday,
  };

  function formatDate(value: Date | null | undefined) {
    if (!value) {
      return "none";
    }

    return value.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatTime(value: Date | null | undefined) {
    if (!value) {
      return "none";
    }

    return value.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-rule bg-paper p-8 text-ink shadow-[0_30px_80px_-35px_rgba(40,40,40,0.28)] dark:border-[#2E2E2B] dark:bg-night dark:text-mist">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <div className="mono text-[11px] text-ink4">/admin/stats</div>
            <div className="serif mt-1 text-[26px] tracking-[-0.01em] text-ink dark:text-mist">Activity</div>
          </div>
          <div className="mono text-[11px] text-ink4">last sync - {formatTime(new Date())}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <AdminStatCard label="total logins" value={stats.loginCount} />
          <AdminStatCard label="first login" value={<span className="text-[26px] leading-tight">{formatDate(stats.firstLoginAt)}</span>} />
          <AdminStatCard label="last login" value={<span className="text-[26px] leading-tight">{formatTime(stats.lastLoginAt)}</span>} />
          <AdminStatCard label="events today" value={eventsToday} />
          <AdminStatCard label="total events" value={totalEvents} />
        </div>

        <div className="hairline my-8 dark:bg-[#2E2E2B]" />

        <div>
          <div className="serif mb-3 text-[13px] lowercase text-ink3 dark:text-ink4">recent - last 8 events</div>
          <div className="mono text-[12px] leading-[1.9] text-ink2 dark:text-[#CFCDC4]">
            {recentEvents.length ? (
              <div className="grid grid-cols-12 gap-2">
                {recentEvents.map((event) => (
                  <div className="contents" key={`${event.createdAt.toISOString()}-${event.rawInput}`}>
                    <span className="col-span-3 text-ink4">{formatTime(event.createdAt)}</span>
                    <span className="col-span-3">{event.inputType}</span>
                    <span className="col-span-6 truncate text-ink3 dark:text-ink4">
                      {event.learnerVisibleLabel} - {event.rawInput}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-ink4">none</div>
            )}
          </div>
        </div>

        <pre className="sr-only">{JSON.stringify(stats, null, 2)}</pre>
      </div>
    </main>
  );
}
