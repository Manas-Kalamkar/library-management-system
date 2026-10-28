import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import type { Borrowing } from "@/lib/types";
import { useBook } from "./books";
import { usePaged } from "./paged";

export const BORROWING_PAGE_SIZE = 10;

export interface BorrowingInput {
    bookId: string;
    borrowerId: string;
    /** required for admins (they have no librarian profile); librarians are recorded from their token */
    librarianId?: string | undefined;
    dueDate?: string | undefined;
}

export const useBorrowings = (page: number) =>
    usePaged<Borrowing>({
        key: "borrowings",
        path: "/borrowings",
        params: { sort: "borrowedAt", order: "desc" },
        page,
        pageSize: BORROWING_PAGE_SIZE,
        unwrap: (raw) => ((raw as { data?: Borrowing[] }).data ?? []),
    });

/** Book title for a loan: embedded when the API sends it, otherwise a cached lookup. */
export function useLoanBook(loan: Pick<Borrowing, "book" | "bookId">) {
    const embedded = loan.book?.title;
    const lookup = useBook(loan.bookId, !embedded);
    return { title: embedded ?? lookup.data?.title, loading: !embedded && lookup.isPending };
}

export function useBorrowingMutations() {
    const qc = useQueryClient();
    // lending and returning change book availability, so refresh both lists
    const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["borrowings"] }), qc.invalidateQueries({ queryKey: ["books"] })]);
    return {
        create: useMutation({ mutationFn: (body: BorrowingInput) => request<Borrowing>("/borrowings", { method: "POST", body }), onSuccess: refresh }),
        setReturned: useMutation({
            mutationFn: ({ id, returnedAt }: { id: string; returnedAt: string | null }) => request(`/borrowings/${id}`, { method: "PATCH", body: { returnedAt } }),
            onSuccess: refresh,
        }),
    };
}
