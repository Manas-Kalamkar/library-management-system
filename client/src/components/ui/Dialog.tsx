import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "./Button";

interface DialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    size?: "sm" | "md" | "lg";
    variant?: "center" | "sheet";
    hideHeader?: boolean;
    children: ReactNode;
}

const sizes = { sm: "w-[min(92vw,26rem)]", md: "w-[min(92vw,34rem)]", lg: "w-[min(94vw,52rem)]" };

/**
 * Built on the native <dialog>: focus trapping, Escape to close, inert background and
 * correct screen-reader semantics come from the browser instead of hand-rolled code.
 * Children are only mounted while open, so forms always start fresh.
 */
export function Dialog({ open, onClose, title, description, size = "md", variant = "center", hideHeader, children }: DialogProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [open]);

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onClose={onClose}
            onClick={(event) => {
                if (event.target === ref.current) onClose(); // click on the backdrop
            }}
            className={cn(
                "max-h-[92dvh] overflow-visible bg-transparent p-0",
                variant === "sheet" ? "m-0 mr-auto h-dvh max-h-none w-[min(86vw,19rem)]" : "m-auto " + sizes[size],
            )}
        >
            {open ? (
                <div
                    className={cn(
                        "flex flex-col overflow-hidden border shadow-2xl",
                        variant === "sheet" ? "h-dvh rounded-none border-rail-line bg-rail text-rail-ink" : "max-h-[92dvh] rounded-2xl border-line bg-surface text-ink",
                    )}
                >
                    {hideHeader ? (
                        <h2 id={titleId} className="sr-only">
                            {title}
                        </h2>
                    ) : (
                        <header className="flex items-start justify-between gap-4 px-6 pt-5">
                            <div>
                                <h2 id={titleId} className="text-xl font-semibold">
                                    {title}
                                </h2>
                                {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
                            </div>
                            <IconButton label="Close" onClick={onClose} className="-mt-1 -mr-2">
                                <X className="size-5" aria-hidden />
                            </IconButton>
                        </header>
                    )}
                    <div className={cn("overflow-y-auto", variant === "sheet" ? "flex-1" : "px-6 pt-4 pb-6")}>{children}</div>
                </div>
            ) : null}
        </dialog>
    );
}

export function DialogFooter({ children }: { children: ReactNode }) {
    return <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>;
}

interface ConfirmProps {
    open: boolean;
    title: string;
    message: ReactNode;
    confirmLabel: string;
    tone?: "danger" | "primary";
    pending?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, tone = "danger", pending, onConfirm, onClose }: ConfirmProps) {
    return (
        <Dialog open={open} onClose={onClose} title={title} size="sm">
            <p className="text-sm text-muted">{message}</p>
            <DialogFooter>
                <Button variant="secondary" onClick={onClose} disabled={pending}>
                    Cancel
                </Button>
                <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={pending}>
                    {confirmLabel}
                </Button>
            </DialogFooter>
        </Dialog>
    );
}
