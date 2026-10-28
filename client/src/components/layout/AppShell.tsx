import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { ArrowLeftRight, BadgeCheck, BookOpen, LogOut, Menu, Monitor, Moon, PenLine, Sun, Users, X, type LucideIcon } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { initials, roleLabel } from "@/lib/format";
import { isStaff, type Role } from "@/lib/types";
import { BrandMark } from "./BrandMark";

interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    visible: (role: Role) => boolean;
}

const NAV: NavItem[] = [
    { to: "/catalogue", label: "Catalogue", icon: BookOpen, visible: () => true },
    { to: "/authors", label: "Authors", icon: PenLine, visible: () => true },
    { to: "/loans", label: "Loans", icon: ArrowLeftRight, visible: isStaff },
    { to: "/borrowers", label: "Borrowers", icon: Users, visible: isStaff },
    { to: "/librarians", label: "Librarians", icon: BadgeCheck, visible: (role) => role === "ADMIN" },
];

const linkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive ? "bg-white/12 text-white" : "text-rail-muted hover:bg-white/6 hover:text-white",
    );

function ThemeButton() {
    const { preference, cycle } = useTheme();
    const Icon = preference === "system" ? Monitor : preference === "light" ? Sun : Moon;
    const next = preference === "system" ? "light" : preference === "light" ? "dark" : "system";
    return (
        <IconButton label={`Theme: ${preference}. Switch to ${next}`} onClick={cycle} className="text-rail-muted hover:bg-white/8 hover:text-white">
            <Icon className="size-4.5" aria-hidden />
        </IconButton>
    );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    if (!user) return null;

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 px-5 pt-6 pb-8">
                <BrandMark />
                <span className="font-serif text-lg font-semibold tracking-tight">City Library</span>
            </div>

            <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3">
                {NAV.filter((item) => item.visible(user.role)).map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} className={linkClasses} onClick={onNavigate}>
                        <Icon className="size-4.5" aria-hidden />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="border-t border-rail-line p-3">
                <NavLink to="/account" className={linkClasses} onClick={onNavigate}>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/14 text-xs font-semibold" aria-hidden>
                        {initials(user.userName)}
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate leading-tight">{user.userName}</span>
                        <span className="block text-xs font-normal text-rail-muted">{roleLabel(user.role)}</span>
                    </span>
                </NavLink>
                <div className="mt-1 flex items-center justify-between px-1">
                    <ThemeButton />
                    <button
                        onClick={async () => {
                            await signOut();
                            navigate("/login", { replace: true });
                        }}
                        className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-rail-muted transition-colors hover:bg-white/8 hover:text-white"
                    >
                        <LogOut className="size-4" aria-hidden />
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}

export function AppShell() {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    // scroll to top when moving between pages
    useEffect(() => window.scrollTo(0, 0), [location.pathname]);

    return (
        <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
            <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg">
                Skip to content
            </a>

            <aside className="sticky top-0 hidden h-dvh bg-rail text-rail-ink lg:block">
                <SidebarContent />
            </aside>

            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-rail-line bg-rail px-3 text-rail-ink lg:hidden">
                <IconButton label="Open menu" onClick={() => setMenuOpen(true)} className="text-rail-ink hover:bg-white/10 hover:text-white">
                    <Menu className="size-5" aria-hidden />
                </IconButton>
                <BrandMark className="size-7" />
                <span className="font-serif text-base font-semibold">City Library</span>
            </header>

            <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" variant="sheet" hideHeader>
                <div className="relative h-full">
                    <IconButton label="Close menu" onClick={() => setMenuOpen(false)} className="absolute top-4 right-3 z-10 text-rail-muted hover:bg-white/10 hover:text-white">
                        <X className="size-5" aria-hidden />
                    </IconButton>
                    <SidebarContent onNavigate={() => setMenuOpen(false)} />
                </div>
            </Dialog>

            <main id="content" tabIndex={-1} className="min-w-0 outline-none">
                <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
