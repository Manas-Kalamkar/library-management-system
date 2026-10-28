import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import type { Borrower } from "@/lib/types";
import { usePaged } from "./paged";

export const BORROWER_PAGE_SIZE = 8;

export interface BorrowerInput {
    name: string;
    email: string;
    password: string;
    phoneNo: string;
}

export const useBorrowers = (params: { search?: string; sort: "name" | "joiningDate"; order: "asc" | "desc" }, page: number) =>
    usePaged<Borrower>({ key: "borrowers", path: "/borrowers", params, page, pageSize: BORROWER_PAGE_SIZE });

export const searchBorrowers = (search: string, signal: AbortSignal) =>
    request<Borrower[]>("/borrowers", { query: { search, limit: BORROWER_PAGE_SIZE, sort: "name", order: "asc" }, signal });

export function useBorrowerMutations() {
    const qc = useQueryClient();
    const refresh = () => qc.invalidateQueries({ queryKey: ["borrowers"] });
    return {
        create: useMutation({ mutationFn: (body: BorrowerInput) => request("/borrowers", { method: "POST", body }), onSuccess: refresh }),
        // URLs use the USER id (Borrower.userId), not the profile id
        update: useMutation({
            mutationFn: ({ userId, body }: { userId: string; body: Partial<BorrowerInput> }) => request(`/borrowers/${userId}`, { method: "PATCH", body }),
            onSuccess: refresh,
        }),
        remove: useMutation({ mutationFn: (userId: string) => request(`/borrowers/${userId}`, { method: "DELETE" }), onSuccess: refresh }),
    };
}
