import { lazy, Suspense, Component, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router";
import { PublicOnly, RequireAuth, RequireRole } from "@/auth/guards";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Display";

const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const SignupPage = lazy(() => import("@/features/auth/SignupPage"));
const CataloguePage = lazy(() => import("@/features/catalogue/CataloguePage"));
const AuthorsPage = lazy(() => import("@/features/authors/AuthorsPage"));
const LoansPage = lazy(() => import("@/features/loans/LoansPage"));
const BorrowersPage = lazy(() => import("@/features/borrowers/BorrowersPage"));
const LibrariansPage = lazy(() => import("@/features/librarians/LibrariansPage"));
const AccountPage = lazy(() => import("@/features/account/AccountPage"));
const NotFoundPage = lazy(() => import("@/features/NotFoundPage"));

const STAFF = ["LIBRARIAN", "ADMIN"] as const;

function PageFallback() {
    return (
        <div className="flex flex-col gap-4" role="status" aria-label="Loading page">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="mt-4 h-64 w-full" />
        </div>
    );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    componentDidCatch(error: unknown) {
        console.error(error);
    }
    render() {
        if (!this.state.failed) return this.props.children;
        return (
            <div className="grid min-h-dvh place-items-center bg-bg p-6 text-center text-ink">
                <div>
                    <h1 className="text-2xl font-semibold">Something broke on this page</h1>
                    <p className="mt-2 text-muted">Reload to try again. If it keeps happening, the problem is on our side, not yours.</p>
                    <button className="mt-5 h-10 rounded-lg bg-brand px-4 text-sm font-medium text-brand-ink" onClick={() => location.reload()}>
                        Reload
                    </button>
                </div>
            </div>
        );
    }
}

export function App() {
    return (
        <ErrorBoundary>
            <Suspense fallback={<div className="p-8"><PageFallback /></div>}>
                <Routes>
                    <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
                    <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />

                    <Route element={<RequireAuth />}>
                        <Route element={<AppShell />}>
                            <Route index element={<Navigate to="/catalogue" replace />} />
                            <Route path="/catalogue" element={<CataloguePage />} />
                            <Route path="/authors" element={<AuthorsPage />} />
                            <Route path="/loans" element={<RequireRole roles={[...STAFF]}><LoansPage /></RequireRole>} />
                            <Route path="/borrowers" element={<RequireRole roles={[...STAFF]}><BorrowersPage /></RequireRole>} />
                            <Route path="/librarians" element={<RequireRole roles={["ADMIN"]}><LibrariansPage /></RequireRole>} />
                            <Route path="/account" element={<AccountPage />} />
                            <Route path="*" element={<NotFoundPage />} />
                        </Route>
                    </Route>
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}
