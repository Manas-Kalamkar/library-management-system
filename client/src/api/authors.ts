import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import type { Author } from "@/lib/types";
import { usePaged } from "./paged";

export const AUTHOR_PAGE_SIZE = 5; // the backend caps authors at 5 per page

export interface AuthorInput {
    name: string;
    birthYear: number;
}

export const useAuthors = (params: { search?: string; sort: "name" | "birthYear"; order: "asc" | "desc" }, page: number) =>
    usePaged<Author>({ key: "authors", path: "/authors", params, page, pageSize: AUTHOR_PAGE_SIZE });

export const useAuthor = (id: string | undefined, enabled = true) =>
    useQuery({
        queryKey: ["authors", "one", id],
        queryFn: ({ signal }) => request<Author>(`/authors/${id}`, { signal }),
        enabled: !!id && enabled,
        staleTime: 10 * 60_000,
    });

export const searchAuthors = (search: string, signal: AbortSignal) =>
    request<Author[]>("/authors", { query: { search, limit: AUTHOR_PAGE_SIZE }, signal });

export function useAuthorMutations() {
    const qc = useQueryClient();
    // book cards show author names, so any author change refreshes books too
    const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["authors"] }), qc.invalidateQueries({ queryKey: ["books"] })]);
    return {
        create: useMutation({ mutationFn: (body: AuthorInput) => request("/authors", { method: "POST", body }), onSuccess: refresh }),
        update: useMutation({
            mutationFn: ({ id, body }: { id: string; body: Partial<AuthorInput> }) => request(`/authors/${id}`, { method: "PATCH", body }),
            onSuccess: refresh,
        }),
        remove: useMutation({ mutationFn: (id: string) => request(`/authors/${id}`, { method: "DELETE" }), onSuccess: refresh }),
    };
}
