import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
    "w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-muted/80 transition-colors " +
    "hover:border-line-strong focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30 disabled:opacity-60";

interface FieldProps {
    label: string;
    error?: string | undefined;
    hint?: ReactNode;
    className?: string | undefined;
}

function FieldShell({ id, label, error, hint, className, children }: FieldProps & { id: string; children: ReactNode }) {
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink">
                {label}
            </label>
            {children}
            {error ? (
                <p id={`${id}-msg`} role="alert" className="text-[0.8125rem] text-danger">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${id}-msg`} className="text-[0.8125rem] text-muted">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

type TextFieldProps = FieldProps & Omit<ComponentProps<"input">, "className"> & { trailing?: ReactNode; inputClassName?: string };

export function TextField({ label, error, hint, className, trailing, inputClassName, ref, ...rest }: TextFieldProps) {
    const id = useId();
    return (
        <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
            <div className="relative">
                <input
                    ref={ref}
                    id={id}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error || hint ? `${id}-msg` : undefined}
                    className={cn(control, "h-10", error ? "border-danger" : "border-line", trailing ? "pr-10" : "", inputClassName)}
                    {...rest}
                />
                {trailing ? <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div> : null}
            </div>
        </FieldShell>
    );
}

type SelectFieldProps = FieldProps & Omit<ComponentProps<"select">, "className">;

export function SelectField({ label, error, hint, className, children, ref, ...rest }: SelectFieldProps) {
    const id = useId();
    return (
        <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
            <select
                ref={ref}
                id={id}
                aria-invalid={error ? true : undefined}
                className={cn(control, "h-10 appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9", error ? "border-danger" : "border-line")}
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23788095' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                }}
                {...rest}
            >
                {children}
            </select>
        </FieldShell>
    );
}

/** Compact search / filter input used above lists (label is visually hidden but present). */
export function SearchInput({ label, className, icon, ref, ...rest }: Omit<ComponentProps<"input">, "className"> & { label: string; className?: string; icon: ReactNode }) {
    const id = useId();
    return (
        <div className={cn("relative", className)}>
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">{icon}</span>
            <input ref={ref} id={id} className={cn(control, "h-10 border-line pl-9")} {...rest} />
        </div>
    );
}

export { control as controlClasses };

/** Compact select for filter bars; the label is read by screen readers only. */
export function CompactSelect({ label, className, children, ref, ...rest }: Omit<ComponentProps<"select">, "className"> & { label: string; className?: string }) {
    const id = useId();
    return (
        <div className={className}>
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            <select
                ref={ref}
                id={id}
                className={cn(control, "h-10 appearance-none border-line bg-[length:1rem] bg-[right_0.7rem_center] bg-no-repeat pr-9")}
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23788095' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                }}
                {...rest}
            >
                {children}
            </select>
        </div>
    );
}
