import { SourceIcon } from "@/components/source-icon/source-icon";
import type { Source } from "@/sources";

type Sample = {
  source: Source;
  title: string;
  duration: string;
  url: string;
};

const samples: Sample[] = [
  {
    source: "youtube",
    title: "【Ado】踊 (Odo)",
    duration: "3:28",
    url: "https://youtu.be/YnSW8ian29w",
  },
  {
    source: "youtube",
    title: "Never Gonna Give You Up",
    duration: "3:33",
    url: "https://youtu.be/dQw4w9WgXcQ",
  },
  {
    source: "x",
    title: "she’s really good!",
    duration: "0:12",
    url: "https://x.com/TheMemesArchive/status/1567258643392827393",
  },
  {
    source: "x",
    title: "valorant breaking bad high five",
    duration: "1:04",
    url: "https://x.com/earlygamegg/status/1562452934469685248/video/1",
  },
  {
    source: "douyin",
    title: "sandman tutorial",
    duration: "5:18",
    url: "https://www.douyin.com/video/7490329970397482290",
  },
];

export function HomeDefaultSourceTags({
  onSelect,
}: {
  onSelect: (url: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="px-2.5 pb-1.5 text-[10px] font-medium uppercase tracking-[0.09em] text-neutral-600">
        Try one
      </span>

      {samples.map((sample) => (
        <button
          key={sample.url}
          type="button"
          onClick={() => onSelect(sample.url)}
          className="group flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-left text-[13px] font-medium text-neutral-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
        >
          <span className="flex min-w-0 flex-1 items-center gap-2.5 transition-transform duration-150 ease-out group-hover:translate-x-1">
            <span className="shrink-0 text-neutral-600 transition-colors group-hover:text-blue-200">
              <SourceIcon source={sample.source} className="size-3.5" />
            </span>
            <span className="truncate">{sample.title}</span>
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-neutral-600">
            {sample.duration}
          </span>
        </button>
      ))}
    </div>
  );
}
