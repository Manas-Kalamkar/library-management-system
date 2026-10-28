import type { ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import { ShieldAlert } from "lucide-react";
import { Skeleton, ErrorState } from "@/components/ui/Display";
import { buttonLikeClasses } from "@/components/ui/links";
import type { Role } from "@/lib/types";
import { useAuth } from "./AuthContext";

export function RequireAuth() {
    const { status, error, retry } = useAuth();
    const location = useLocation();

    if (status === "loading") {
        return (
            <div className="grid min-h-dvh place-items-center bg-bg" role="status" aria-label="Loading">
                <div className="flex w-64 flex-col gap-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
            </div>
        );
    }
    if (status === "error") {
        return (
            <div className="grid min-h-dvh place-items-center bg-bg p-6">
                <div className="w-full max-w-md">
                    <ErrorState error={error} onRetry={retry} />
                </div>
            </div>
        );
    }
    if (status === "anonymous") return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    return <Outlet />;
}

/** Sends signed-in users away from the sign-in / sign-up pages. */
export function PublicOnly({ children }: { children: ReactNode }) {
    const { status } = useAuth();
    if (status === "authenticated") return <Navigate to="/catalogue" replace />;
    return children;
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
    const { user } = useAuth();
    if (!user || !roles.includes(user.role)) {
        return (
            <div className="grid place-items-center rounded-2xl border border-line bg-surface px-6 py-16 text-center">
                <ShieldAlert className="size-8 text-muted" aria-hidden />
                <h1 className="mt-3 text-xl font-semibold">You don't have access to this page</h1>
                <p className="mt-1 max-w-sm text-sm text-muted">This area is only available to {roles.includes("ADMIN") && roles.length === 1 ? "administrators" : "library staff"}.</p>
                <Link to="/catalogue" className={`${buttonLikeClasses("secondary")} mt-5`}>
                    Back to the catalogue
                </Link>
            </div>
        );
    }
    return children;
}
