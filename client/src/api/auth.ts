import { request } from "@/lib/api";
import type { AuthSession, User } from "@/lib/types";

export interface SignupInput {
    userName: string;
    email: string;
    password: string;
    phoneNo: string;
}

export const login = (email: string, password: string) =>
    request<AuthSession>("/auth/login", { method: "POST", body: { email, password }, auth: false });

export const signup = (body: SignupInput) => request<User>("/auth/signup", { method: "POST", body, auth: false });

// logout works with only the cookie, so it must not try to refresh on 401
export const logout = () => request("/auth/logout", { method: "POST", auth: false });
export const logoutEverywhere = () => request("/auth/logout-all", { method: "POST" });

export const changePassword = (currentPassword: string, newPassword: string) =>
    request<AuthSession & { message: string }>("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });

export const deleteAccount = (id: string) => request(`/auth/${id}`, { method: "DELETE" });
