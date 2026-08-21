import {
  LayerCard,
  LayerCardContent,
  LayerCardSecondary,
} from "@/components/layer-card/layer-card";
import { cn } from "@/lib/utils";
import {
  DashboardTrafficChart,
  type DailyViews,
} from "./dashboard-traffic-chart";

type Analytics = {
  total: number;
  month: number;
  previous_month: number | null;
  since: string | null;
  daily: DailyViews[];
};

const number = new Intl.NumberFormat();

export function DashboardViewsCard({
  analytics,
  className,
}: {
  analytics: Analytics;
  /** Spacing against its neighbours belongs to whoever lays this out. */
  className?: string;
}) {
  const today = analytics.daily.at(-1);

  return (
    <section className={cn(className)}>
      <LayerCard>
        <LayerCardSecondary className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
          <span className="text-[12.5px] font-medium text-white">Traffic</span>
          {/* The window the chart is drawing — context for the title rather
              than a figure, which is why it reads quieter and why every actual
              number now sits together in the footer. */}
          <span className="font-mono text-[11.5px] uppercase tracking-[0.05em] tabular-nums text-neutral-500">
            {analytics.daily.length} days
          </span>
        </LayerCardSecondary>

        <LayerCardContent className="p-3.5">
          <DashboardTrafficChart daily={analytics.daily} />
        </LayerCardContent>

        <LayerCardSecondary className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2">
          {/* All-time first, month second, both plain reference figures. No
              percentage: an honest month-over-month delta needs same-day-of-
              month comparison, and the chart is where that comparison lives
              now anyway. */}
          <span className="font-mono text-[11.5px] uppercase tracking-[0.05em] tabular-nums text-neutral-500">
            <span className="text-neutral-300">
              {number.format(analytics.total)}
            </span>{" "}
            all time
            <span className="px-1.5 text-neutral-700">·</span>
            <span className="text-neutral-300">
              {number.format(analytics.month)}
            </span>{" "}
            this month
          </span>
          {/* Value first, period after — the same shape as "8,833 all time"
              beside it, so the three figures read as one row. This is the
              card's only number at rest; the chart's readout needs a pointer. */}
          <span className="font-mono text-[11.5px] uppercase tracking-[0.05em] tabular-nums text-neutral-500">
            <span className="text-neutral-300">
              {number.format(today?.views ?? 0)}
            </span>{" "}
            today
          </span>
        </LayerCardSecondary>
      </LayerCard>
    </section>
  );
}
