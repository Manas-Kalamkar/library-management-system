import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemePreference = "system" | "light" | "dark";

const KEY = "theme";
const ThemeContext = createContext<{ preference: ThemePreference; cycle: () => void } | null>(null);

const read = (): ThemePreference => {
    try {
        const stored = localStorage.getItem(KEY);
        return stored === "light" || stored === "dark" ? stored : "system";
    } catch {
        return "system";
    }
};

const apply = (preference: ThemePreference) => {
    const dark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
};

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [preference, setPreference] = useState<ThemePreference>(read);

    useEffect(() => {
        apply(preference);
        if (preference !== "system") return;
        const media = matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => apply("system");
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, [preference]);

    const cycle = useCallback(() => {
        setPreference((current) => {
            const next: ThemePreference = current === "system" ? "light" : current === "light" ? "dark" : "system";
            try {
                if (next === "system") localStorage.removeItem(KEY);
                else localStorage.setItem(KEY, next);
            } catch {
                /* private mode: the choice just won't persist */
            }
            return next;
        });
    }, []);

    const value = useMemo(() => ({ preference, cycle }), [preference, cycle]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
    return ctx;
};
