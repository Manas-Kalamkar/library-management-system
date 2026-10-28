import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import type { Librarian } from "@/lib/types";
import { usePaged } from "./paged";

export const LIBRARIAN_PAGE_SIZE = 8;

export interface LibrarianInput {
    name: string;
    email: string;
    password: string;
    salary: number;
    joiningYear: number;
}

export const useLibrarians = (params: { search?: string; sort: "name" | "salary" | "joiningYear"; order: "asc" | "desc" }, page: number) =>
    usePaged<Librarian>({ key: "librarians", path: "/librarians", params, page, pageSize: LIBRARIAN_PAGE_SIZE });

export const searchLibrarians = (search: string, signal: AbortSignal) =>
    request<Librarian[]>("/librarians", { query: { search, limit: LIBRARIAN_PAGE_SIZE, sort: "name", order: "asc" }, signal });

export function useLibrarianMutations() {
    const qc = useQueryClient();
    const refresh = () => qc.invalidateQueries({ queryKey: ["librarians"] });
    return {
        create: useMutation({ mutationFn: (body: LibrarianInput) => request("/librarians", { method: "POST", body }), onSuccess: refresh }),
        update: useMutation({
            mutationFn: ({ userId, body }: { userId: string; body: Partial<LibrarianInput> }) => request(`/librarians/${userId}`, { method: "PATCH", body }),
            onSuccess: refresh,
        }),
        remove: useMutation({ mutationFn: (userId: string) => request(`/librarians/${userId}`, { method: "DELETE" }), onSuccess: refresh }),
    };
}
