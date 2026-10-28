import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as authApi from "@/api/auth";
import { onSessionExpired, refreshSession, setAccessToken } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { AuthSession, User } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

type Status = "loading" | "authenticated" | "anonymous" | "error";

interface AuthContextValue {
    status: Status;
    user: User | null;
    error: unknown;
    signIn: (email: string, password: string) => Promise<User>;
    signUp: (input: authApi.SignupInput) => Promise<User>;
    signOut: () => Promise<void>;
    signOutEverywhere: () => Promise<void>;
    /** adopt the tokens returned by an endpoint (e.g. change-password) */
    adoptSession: (session: AuthSession) => void;
    retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
};

/** Signed in or not, there's never a user-specific cache to keep once the identity changes. */
const resetSessionState = () => {
    setAccessToken(null);
    queryClient.clear();
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const toast = useToast();
    const [status, setStatus] = useState<Status>("loading");
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<unknown>(null);
    const channel = useRef<BroadcastChannel | null>(null);

    const restore = useCallback(() => {
        setStatus("loading");
        setError(null);
        refreshSession().then(
            (session) => {
                setUser(session?.user ?? null);
                setStatus(session ? "authenticated" : "anonymous");
            },
            (e: unknown) => {
                setError(e);
                setStatus("error");
            },
        );
    }, []);

    // Restore the session from the refresh cookie on first load.
    useEffect(restore, [restore]);

    // A request discovered the session is over (refresh rejected).
    useEffect(() => {
        onSessionExpired(() => {
            resetSessionState();
            setUser(null);
            setStatus((current) => {
                if (current === "authenticated") toast.error("Your session ended. Sign in again to continue.");
                return "anonymous";
            });
        });
        return () => onSessionExpired(null);
    }, [toast]);

    // Signing out in one tab signs out every tab.
    useEffect(() => {
        if (typeof BroadcastChannel === "undefined") return;
        const bc = new BroadcastChannel("city-library-auth");
        channel.current = bc;
        bc.onmessage = (event) => {
            if (event.data === "signed-out") {
                resetSessionState();
                setUser(null);
                setStatus("anonymous");
            }
        };
        return () => {
            bc.close();
            channel.current = null;
        };
    }, []);

    const adoptSession = useCallback((session: AuthSession) => {
        setAccessToken(session.accessToken);
        setUser(session.user);
        setStatus("authenticated");
    }, []);

    const signIn = useCallback(
        async (email: string, password: string) => {
            const session = await authApi.login(email, password);
            queryClient.clear(); // never show the previous user's cached data
            adoptSession(session);
            return session.user;
        },
        [adoptSession],
    );

    const signUp = useCallback(
        async (input: authApi.SignupInput) => {
            await authApi.signup(input);
            return signIn(input.email, input.password);
        },
        [signIn],
    );

    const finishSignOut = useCallback(() => {
        resetSessionState();
        setUser(null);
        setStatus("anonymous");
        channel.current?.postMessage("signed-out");
    }, []);

    const signOut = useCallback(async () => {
        try {
            await authApi.logout();
        } catch {
            /* even if the server can't be reached, forget the session locally */
        }
        finishSignOut();
    }, [finishSignOut]);

    const signOutEverywhere = useCallback(async () => {
        await authApi.logoutEverywhere();
        finishSignOut();
    }, [finishSignOut]);

    const value = useMemo<AuthContextValue>(
        () => ({ status, user, error, signIn, signUp, signOut, signOutEverywhere, adoptSession, retry: restore }),
        [status, user, error, signIn, signUp, signOut, signOutEverywhere, adoptSession, restore],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
