import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDebounced } from "@/hooks/useDebounced";
import { controlClasses } from "./Fields";

interface ComboboxProps<T> {
    label: string;
    value: T | null;
    onChange: (value: T | null) => void;
    /** Fetches options for the typed text (empty string = default list). */
    search: (query: string, signal: AbortSignal) => Promise<T[]>;
    getKey: (item: T) => string;
    getLabel: (item: T) => string;
    getHint?: (item: T) => string | undefined;
    placeholder?: string;
    error?: string | undefined;
    disabled?: boolean;
    emptyText?: string;
}

/**
 * Searchable single-select following the WAI-ARIA combobox pattern: the input keeps focus,
 * arrow keys move a virtual cursor (aria-activedescendant), Enter picks, Escape closes.
 */
export function Combobox<T>({ label, value, onChange, search, getKey, getLabel, getHint, placeholder = "Search…", error, disabled, emptyText = "No matches" }: ComboboxProps<T>) {
    const id = useId();
    const listId = `${id}-list`;
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [options, setOptions] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [active, setActive] = useState(0);
    const wrapRef = useRef<HTMLDivElement>(null);
    const debounced = useDebounced(query, 250);

    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        setLoading(true);
        setFailed(false);
        search(debounced, controller.signal)
            .then((items) => {
                setOptions(items);
                setActive(0);
            })
            .catch((e: unknown) => {
                if (!(e instanceof DOMException && e.name === "AbortError")) setFailed(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `search` is intentionally not a dependency
    }, [debounced, open]);

    const choose = (item: T) => {
        onChange(item);
        setOpen(false);
        setQuery("");
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!open) setOpen(true);
            else setActive((i) => Math.min(i + 1, options.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (event.key === "Enter" && open) {
            const item = options[active];
            if (item) {
                event.preventDefault();
                choose(item);
            }
        } else if (event.key === "Escape" && open) {
            event.stopPropagation(); // don't also close the dialog this lives in
            event.preventDefault();
            setOpen(false);
        }
    };

    const shown = open ? query : value ? getLabel(value) : "";
    const activeId = open && options[active] ? `${id}-opt-${getKey(options[active]!)}` : undefined;

    return (
        <div
            ref={wrapRef}
            className="relative flex flex-col gap-1.5"
            onBlur={(event) => {
                if (!wrapRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
            }}
        >
            <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={activeId}
                    aria-invalid={error ? true : undefined}
                    autoComplete="off"
                    disabled={disabled}
                    value={shown}
                    placeholder={value ? "" : placeholder}
                    onFocus={() => setOpen(true)}
                    onClick={() => setOpen(true)}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onKeyDown={onKeyDown}
                    className={cn(controlClasses, "h-10 pr-16", error ? "border-danger" : "border-line")}
                />
                <div className="absolute inset-y-0 right-1.5 flex items-center gap-0.5 text-muted">
                    {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                    {value && !disabled ? (
                        <button type="button" aria-label={`Clear ${label}`} onClick={() => onChange(null)} className="grid size-7 place-items-center rounded-md hover:bg-brand-soft hover:text-ink">
                            <X className="size-4" aria-hidden />
                        </button>
                    ) : (
                        <ChevronsUpDown className="mr-1.5 size-4" aria-hidden />
                    )}
                </div>
            </div>

            {open ? (
                <ul
                    id={listId}
                    role="listbox"
                    aria-label={label}
                    className="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-line-strong bg-surface p-1 shadow-xl"
                >
                    {failed ? (
                        <li className="px-3 py-2 text-sm text-danger">Couldn't load options. Keep typing to retry.</li>
                    ) : options.length === 0 && !loading ? (
                        <li className="px-3 py-2 text-sm text-muted">{emptyText}</li>
                    ) : (
                        options.map((item, index) => {
                            const selected = value !== null && getKey(value) === getKey(item);
                            return (
                                <li
                                    key={getKey(item)}
                                    id={`${id}-opt-${getKey(item)}`}
                                    role="option"
                                    aria-selected={selected}
                                    onMouseDown={(e) => e.preventDefault()} // keep focus in the input
                                    onClick={() => choose(item)}
                                    onMouseEnter={() => setActive(index)}
                                    className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm", index === active && "bg-brand-soft")}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate">{getLabel(item)}</span>
                                        {getHint?.(item) ? <span className="block truncate text-xs text-muted">{getHint(item)}</span> : null}
                                    </span>
                                    {selected ? <Check className="size-4 shrink-0 text-brand" aria-hidden /> : null}
                                </li>
                            );
                        })
                    )}
                </ul>
            ) : null}

            {error ? (
                <p role="alert" className="text-[0.8125rem] text-danger">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
