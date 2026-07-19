type Source = "youtube" | "x";

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
    duration: "0:19",
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
    title: "breaking bad high five",
    duration: "1:04",
    url: "https://x.com/earlygamegg/status/1562452934469685248/video/1",
  },
];

/** lucide dropped brand glyphs — keep these marks inline. */
function SourceIcon({ source }: { source: Source }) {
  if (source === "youtube") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden>
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden>
      <path d="M18.2 2.2h3.4l-7.4 8.5L23 21.8h-6.8l-5.3-7-6.1 7H1.4l7.9-9.1L1 2.2h7l4.8 6.4 5.4-6.4Zm-1.2 17.6h1.9L7.1 4.1H5.1l11.9 15.7Z" />
    </svg>
  );
}

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
              <SourceIcon source={sample.source} />
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
