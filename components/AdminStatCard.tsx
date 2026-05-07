import { forwardRef } from "react";

import { cn } from "@/lib/cn";

type AdminStatCardProps = React.HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: React.ReactNode;
};

export const AdminStatCard = forwardRef<HTMLDivElement, AdminStatCardProps>(function AdminStatCard(
  { className, label, value, ...props },
  ref,
) {
  return (
    <div className={cn("rounded-xl border border-rule bg-paper2/40 p-5 dark:border-[#2E2E2B] dark:bg-night2", className)} ref={ref} {...props}>
      <div className="text-[12px] uppercase tracking-wider text-ink4">{label}</div>
      <div className="serif mt-3 text-[40px] leading-none tracking-[-0.015em] text-ink dark:text-mist">{value}</div>
    </div>
  );
});
