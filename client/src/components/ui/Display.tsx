import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, CloudOff, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";
import { ApiError, errorMessage } from "@/lib/api";
import { Button } from "./Button";

type Tone = "ok" | "warn" | "danger" | "neutral" | "brand";

const tones: Record<Tone, string> = {
    ok: "bg-ok-bg text-ok",
    warn: "bg-warn-bg text-warn",
    danger: "bg-danger-bg text-danger",
    neutral: "bg-surface-2 text-muted border border-line",
    brand: "bg-brand-soft text-brand",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
    return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone], className)}>
            {tone !== "neutral" && tone !== "brand" ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
            {children}
        </span>
    );
}

export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={cn(
                "animate-[shimmer_1.4s_linear_infinite] rounded-md bg-[linear-gradient(90deg,var(--surface-2)_25%,var(--line)_50%,var(--surface-2)_75%)] bg-[length:200%_100%]",
                className,
            )}
        />
    );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-[1.75rem] leading-tight font-semibold sm:text-[2rem]">{title}</h1>
                {description ? <p className="mt-1 max-w-prose text-muted">{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
    );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
    return (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center">
            <Inbox className="size-8 text-muted" aria-hidden />
            <h2 className="mt-3 text-lg font-semibold">{title}</h2>
            {message ? <p className="mt-1 max-w-sm text-sm text-muted">{message}</p> : null}
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
    const network = error instanceof ApiError && error.isNetwork;
    return (
        <div role="alert" className="grid place-items-center rounded-2xl border border-danger/30 bg-danger-bg/40 px-6 py-12 text-center">
            <CloudOff className="size-8 text-danger" aria-hidden />
            <h2 className="mt-3 text-lg font-semibold">{network ? "Can't reach the server" : "Couldn't load this"}</h2>
            <p className="mt-1 max-w-sm text-sm text-muted">{errorMessage(error)}</p>
            {onRetry ? (
                <Button variant="secondary" className="mt-5" onClick={onRetry}>
                    Try again
                </Button>
            ) : null}
        </div>
    );
}

interface PaginationProps {
    page: number;
    hasNext: boolean;
    onPage: (page: number) => void;
    busy?: boolean;
    /** items on this page, shown for context */
    count?: number;
}

export function Pagination({ page, hasNext, onPage, busy, count }: PaginationProps) {
    return (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
                Page {page}
                {count !== undefined ? `, ${count} ${count === 1 ? "result" : "results"}` : ""}
            </p>
            <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={<ChevronLeft className="size-4" aria-hidden />} disabled={page <= 1 || busy} onClick={() => onPage(page - 1)}>
                    Previous
                </Button>
                <Button variant="secondary" size="sm" disabled={!hasNext || busy} onClick={() => onPage(page + 1)}>
                    Next
                    <ChevronRight className="size-4" aria-hidden />
                </Button>
            </div>
        </nav>
    );
}

interface SegmentedProps<T extends string> {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
    return (
        <div role="radiogroup" aria-label={label} className="inline-flex h-10 rounded-lg border border-line bg-surface-2 p-1">
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "rounded-md px-3 text-sm font-medium transition-colors",
                            selected ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink",
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
