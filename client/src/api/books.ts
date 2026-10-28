import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import type { Book } from "@/lib/types";
import { useAuthor } from "./authors";
import { usePaged } from "./paged";

export const BOOK_PAGE_SIZE = 8;
const BOOK_MAX_PAGE = 20; // enforced by the backend

export type BookSort = "title" | "genre" | "publishedYear";

export interface BookFilters {
    search?: string;
    genre?: string;
    available?: "true" | "false";
    sort: BookSort;
    order: "asc" | "desc";
}

export interface BookInput {
    title: string;
    genre: string;
    publishedYear: number;
    authorId: string;
}

export const useBooks = (filters: BookFilters, page: number) =>
    usePaged<Book>({ key: "books", path: "/books", params: { ...filters }, page, pageSize: BOOK_PAGE_SIZE, maxPage: BOOK_MAX_PAGE });

export const useBook = (id: string | undefined, enabled = true) =>
    useQuery({
        queryKey: ["books", "one", id],
        queryFn: ({ signal }) => request<Book>(`/books/${id}`, { signal }),
        enabled: !!id && enabled,
        staleTime: 10 * 60_000,
    });

export const searchBooks = (search: string, signal: AbortSignal, availableOnly = false) =>
    request<Book[]>("/books", { query: { search, limit: BOOK_PAGE_SIZE, available: availableOnly ? "true" : undefined, sort: "title", order: "asc" }, signal });

/** Author name for a book: uses the embedded author when the API sends it, otherwise looks it up (cached). */
export function useBookAuthor(book: Pick<Book, "author" | "authorId">) {
    const embedded = book.author?.name;
    const lookup = useAuthor(book.authorId, !embedded);
    return { name: embedded ?? lookup.data?.name, loading: !embedded && lookup.isPending };
}

export function useBookMutations() {
    const qc = useQueryClient();
    const refresh = () => qc.invalidateQueries({ queryKey: ["books"] });
    return {
        // the API answers create with plain text, so there's no body worth returning
        create: useMutation({ mutationFn: (body: BookInput) => request("/books", { method: "POST", body: { ...body, available: true } }), onSuccess: refresh }),
        update: useMutation({
            mutationFn: ({ id, body }: { id: string; body: Partial<BookInput> }) => request(`/books/${id}`, { method: "PATCH", body }),
            onSuccess: refresh,
        }),
        remove: useMutation({ mutationFn: (id: string) => request(`/books/${id}`, { method: "DELETE" }), onSuccess: refresh }),
    };
}
