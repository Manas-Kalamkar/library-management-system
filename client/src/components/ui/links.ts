import { cn } from "@/lib/cn";

/** Class names that make a <Link> look like a <Button>. */
export const buttonLikeClasses = (variant: "primary" | "secondary" = "primary") =>
    cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium whitespace-nowrap transition-colors",
        variant === "primary" ? "bg-brand text-brand-ink hover:bg-brand-hover" : "border border-line-strong bg-surface text-ink hover:bg-surface-2",
    );
