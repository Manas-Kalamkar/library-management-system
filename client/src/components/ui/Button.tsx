import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
    primary: "bg-brand text-brand-ink hover:bg-brand-hover",
    secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2",
    ghost: "text-ink hover:bg-brand-soft",
    danger: "bg-danger text-danger-ink hover:opacity-90",
};

interface ButtonProps extends ComponentProps<"button"> {
    variant?: Variant;
    size?: "sm" | "md";
    loading?: boolean;
    icon?: ReactNode;
}

export function Button({ variant = "primary", size = "md", loading, icon, className, children, disabled, type = "button", ...rest }: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={cn(
                "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors",
                "disabled:pointer-events-none disabled:opacity-50",
                size === "sm" ? "h-8 px-3 text-[0.8125rem]" : "h-10 px-4 text-sm",
                variants[variant],
                className,
            )}
            {...rest}
        >
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
            {children}
        </button>
    );
}

export function IconButton({ label, className, children, ...rest }: ComponentProps<"button"> & { label: string }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={cn(
                "inline-grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-brand-soft hover:text-ink",
                "disabled:pointer-events-none disabled:opacity-50",
                className,
            )}
            {...rest}
        >
            {children}
        </button>
    );
}
