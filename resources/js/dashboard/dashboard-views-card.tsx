import {
  LayerCard,
  LayerCardContent,
  LayerCardSecondary,
} from "@/components/layer-card/layer-card";

type Analytics = {
  total: number;
  month: number;
  previous_month: number | null;
  since: string | null;
};

const number = new Intl.NumberFormat();
const monthName = new Intl.DateTimeFormat(undefined, { month: "long" });
const sinceDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/**
 * Big numbers rather than the cookie card's leader rows: these are the
 * headline figures on the page, not a spec sheet. font-mono per the stats
 * rule in AGENTS.md, tabular-nums so digits don't jitter between renders.
 */
function Stat({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption?: string;
}) {
  return (
    <div className="px-1 py-1">
      <dt className="font-mono text-[12.5px] uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1.5 font-mono text-[28px] leading-none tracking-[-0.02em] tabular-nums text-white">
        {number.format(value)}
      </dd>
      {caption ? (
        <p className="mt-1.5 font-mono text-[11.5px] tracking-wide tabular-nums text-neutral-500">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

export function DashboardViewsCard({ analytics }: { analytics: Analytics }) {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return (
    <section>
      <LayerCard>
        <LayerCardSecondary className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
          <span className="text-[12.5px] font-medium text-white">Traffic</span>
          {analytics.since ? (
            // A total that started three weeks ago should never be mistaken
            // for a lifetime figure — hence the date, in the header.
            //
            // Parsed as `${since}T00:00:00` rather than the bare YYYY-MM-DD:
            // the bare form is spec'd as UTC midnight, which renders as the
            // previous day for anyone west of Greenwich.
            <span className="font-mono text-[11.5px] uppercase tracking-wide text-neutral-500">
              since {sinceDate.format(new Date(`${analytics.since}T00:00:00`))}
            </span>
          ) : null}
        </LayerCardSecondary>

        <LayerCardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 px-1 py-1 sm:grid-cols-2">
            <Stat label="Total views" value={analytics.total} />

            {/* Labelled with the month name, not "This month" — it has to read
                as a calendar month that resets, not a rolling 30 days.

                The caption is a plain reference figure, not a % delta: a
                percentage between a partial month and a complete one reads as
                a ~90% collapse every 3rd of the month. An honest delta needs
                same-day-of-month comparison, which is a third query. */}
            <Stat
              label={monthName.format(now)}
              value={analytics.month}
              caption={
                analytics.previous_month === null
                  ? undefined
                  : `${number.format(analytics.previous_month)} in ${monthName.format(previous)}`
              }
            />
          </dl>
        </LayerCardContent>
      </LayerCard>
    </section>
  );
}
