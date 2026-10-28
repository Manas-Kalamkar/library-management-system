import { cn } from "@/lib/cn";
import { coverFor } from "@/lib/cover";

interface BookCoverProps {
    title: string;
    genre: string;
    year: number;
    authorName?: string | undefined;
    /** true while the author is still being looked up */
    authorLoading?: boolean;
    dimmed?: boolean;
    className?: string;
}

const ink = "rgba(255,255,255,0.13)";

function Motif({ index }: { index: number }) {
    switch (index) {
        case 0: // rising circles
            return (
                <g fill="none" stroke={ink} strokeWidth="1.2">
                    <circle cx="74" cy="40" r="12" />
                    <circle cx="74" cy="40" r="22" />
                    <circle cx="74" cy="40" r="32" />
                    <circle cx="74" cy="40" r="42" />
                </g>
            );
        case 1: // ruled bands
            return (
                <g fill={ink}>
                    <rect x="0" y="20" width="100" height="3" />
                    <rect x="0" y="27" width="100" height="1.2" />
                    <rect x="0" y="32" width="100" height="1.2" />
                </g>
            );
        case 2: // diagonal fold
            return <polygon points="0,150 100,92 100,150" fill={ink} />;
        default: // dot grid
            return (
                <g fill={ink}>
                    {Array.from({ length: 5 }, (_, row) =>
                        Array.from({ length: 5 }, (_, col) => <circle key={`${row}-${col}`} cx={52 + col * 10} cy={14 + row * 10} r="1.8" />),
                    )}
                </g>
            );
    }
}

/** Typographic cover. Sizes everything in container units, so one component fits a grid cell and a dialog. */
export function BookCover({ title, genre, year, authorName, authorLoading, dimmed, className }: BookCoverProps) {
    const { cloth, motif } = coverFor(genre, title);
    const long = title.length > 28;

    return (
        <div
            role="img"
            aria-label={`Cover of ${title}`}
            style={{ backgroundColor: cloth, containerType: "inline-size" }}
            className={cn(
                "relative aspect-[2/3] w-full overflow-hidden rounded-[3px_7px_7px_3px] text-[#faf7f0] shadow-[0_1px_2px_rgb(0_0_0/0.25),0_8px_18px_-8px_rgb(0_0_0/0.45)] transition-[filter,opacity]",
                dimmed && "opacity-60 saturate-50",
                className,
            )}
        >
            <svg viewBox="0 0 100 150" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
                <Motif index={motif} />
            </svg>
            {/* spine hinge and page-edge light */}
            <div aria-hidden className="absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/35 via-black/10 to-transparent" />
            <div aria-hidden className="absolute inset-y-0 left-[7%] w-px bg-white/15" />

            <div className="relative flex h-full flex-col justify-between p-[11cqw] pl-[15cqw]">
                <p className="font-sans font-medium text-[#faf7f0]/80" style={{ fontSize: "5.6cqw" }}>
                    {genre}
                </p>
                <div>
                    <h3 className="line-clamp-5 font-serif font-bold text-balance" style={{ fontSize: long ? "9.4cqw" : "12.4cqw", lineHeight: 1.06 }}>
                        {title}
                    </h3>
                    <div className="mt-[5cqw] h-[0.6cqw] w-[12cqw] bg-[#faf7f0]/70" aria-hidden />
                    {authorLoading ? (
                        <div className="mt-[5cqw] h-[5cqw] w-[48cqw] rounded-sm bg-white/20" aria-hidden />
                    ) : (
                        <p className="mt-[4.6cqw] line-clamp-2 font-sans font-medium text-[#faf7f0]/90" style={{ fontSize: "6cqw", lineHeight: 1.25 }}>
                            {authorName ?? ""}
                        </p>
                    )}
                    <p className="mt-[1.6cqw] font-sans text-[#faf7f0]/65" style={{ fontSize: "5cqw" }}>
                        {year}
                    </p>
                </div>
            </div>
        </div>
    );
}
