import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { request, type Query } from "@/lib/api";

interface PagedArgs<T> {
    /** first segment of the query key; mutations invalidate by it */
    key: string;
    path: string;
    params: Query;
    page: number;
    pageSize: number;
    /** the backend caps `page` on some resources */
    maxPage?: number;
    unwrap?: (raw: unknown) => T[];
}

/**
 * The API returns a bare array and no total count, so "is there a next page?" is answered by
 * quietly fetching page+1 (React Query caches it, so clicking Next is instant).
 */
export function usePaged<T>({ key, path, params, page, pageSize, maxPage = Infinity, unwrap }: PagedArgs<T>) {
    const options = (p: number) => ({
        queryKey: [key, "list", params, p] as const,
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<T[]> => {
            const raw = await request<unknown>(path, { query: { ...params, page: p, limit: pageSize }, signal });
            return unwrap ? unwrap(raw) : (raw as T[]);
        },
    });

    const current = useQuery({ ...options(page), placeholderData: keepPreviousData });
    const mayHaveMore = (current.data?.length ?? 0) >= pageSize && page < maxPage;
    const next = useQuery({ ...options(page + 1), enabled: mayHaveMore });

    return {
        ...current,
        hasNext: mayHaveMore && (next.data?.length ?? 0) > 0,
        checkingNext: mayHaveMore && next.isPending,
    };
}
