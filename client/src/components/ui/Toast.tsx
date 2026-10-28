import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ToastItem {
    id: number;
    tone: "success" | "error";
    message: string;
    action?: { label: string; onClick: () => void } | undefined;
}

interface ToastApi {
    success: (message: string, action?: ToastItem["action"]) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
    return ctx;
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);
    const regionRef = useRef<HTMLDivElement>(null);
    const nextId = useRef(1);

    const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

    const push = useCallback(
        (tone: ToastItem["tone"], message: string, action?: ToastItem["action"]) => {
            const id = nextId.current++;
            setItems((list) => [...list.slice(-3), { id, tone, message, action }]);
            setTimeout(() => dismiss(id), action ? 8000 : 5000);
        },
        [dismiss],
    );

    const api = useMemo<ToastApi>(
        () => ({ success: (m, a) => push("success", m, a), error: (m) => push("error", m) }),
        [push],
    );

    // Open modal dialogs live in the browser's top layer and would cover a normal fixed element.
    // A manual popover joins the top layer too; re-showing it on every toast keeps it above them.
    useEffect(() => {
        const el = regionRef.current;
        if (!el || typeof el.showPopover !== "function") return;
        if (items.length === 0) {
            if (el.matches(":popover-open")) el.hidePopover();
            return;
        }
        if (el.matches(":popover-open")) el.hidePopover();
        el.showPopover();
    }, [items]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div
                ref={regionRef}
                popover="manual"
                role="region"
                aria-label="Notifications"
                className="fixed inset-auto right-4 bottom-4 left-4 m-0 flex flex-col items-end gap-2 overflow-visible border-0 bg-transparent p-0 sm:left-auto"
            >
                {items.map((t) => (
                    <div
                        key={t.id}
                        role={t.tone === "error" ? "alert" : "status"}
                        className={cn(
                            "flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface p-3.5 text-sm text-ink shadow-xl [animation:toast-in_160ms_ease-out]",
                            t.tone === "error" ? "border-danger/40" : "border-line",
                        )}
                    >
                        {t.tone === "error" ? (
                            <AlertCircle className="mt-0.5 size-4.5 shrink-0 text-danger" aria-hidden />
                        ) : (
                            <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-ok" aria-hidden />
                        )}
                        <p className="flex-1">{t.message}</p>
                        {t.action ? (
                            <button
                                className="font-semibold text-brand underline-offset-2 hover:underline"
                                onClick={() => {
                                    t.action?.onClick();
                                    dismiss(t.id);
                                }}
                            >
                                {t.action.label}
                            </button>
                        ) : null}
                        <button aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="text-muted hover:text-ink">
                            <X className="size-4" aria-hidden />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
