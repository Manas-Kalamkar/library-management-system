import { useState } from "react";
import { Plus, Undo2 } from "lucide-react";
import { useBorrowingMutations, useBorrowings, useLoanBook } from "@/api/borrowings";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Badge, EmptyState, ErrorState, PageHeader, Pagination } from "@/components/ui/Display";
import { useToast } from "@/components/ui/Toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useListState } from "@/hooks/useListState";
import { errorMessage } from "@/lib/api";
import { daysUntil, formatDate, loanStatus, shortId } from "@/lib/format";
import type { Borrowing } from "@/lib/types";
import { LendDialog } from "./LendDialog";

export default function LoansPage() {
    useDocumentTitle("Loans");
    const toast = useToast();
    const list = useListState();
    const loans = useBorrowings(list.page);
    const { setReturned } = useBorrowingMutations();
    const [lending, setLending] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const markReturned = async (loan: Borrowing, title?: string) => {
        setBusyId(loan.id);
        try {
            await setReturned.mutateAsync({ id: loan.id, returnedAt: new Date().toISOString() });
            toast.success(`${title ? `“${title}”` : "Book"} marked as returned.`, {
                label: "Undo",
                onClick: () => setReturned.mutate({ id: loan.id, returnedAt: null }),
            });
        } catch (error) {
            toast.error(errorMessage(error));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <>
            <PageHeader title="Loans" description="Who has what, and when it is due back." actions={<Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setLending(true)}>New loan</Button>} />
            {loans.isError ? (
                <ErrorState error={loans.error} onRetry={() => loans.refetch()} />
            ) : !loans.isPending && loans.data.length === 0 ? (
                <EmptyState title="No loans yet" message="Lend a book to see it here." action={<Button onClick={() => setLending(true)}>New loan</Button>} />
            ) : (
                <>
                    <DataTable<Borrowing>
                        caption="Loans"
                        loading={loans.isPending}
                        dimmed={loans.isPlaceholderData}
                        rows={loans.data ?? []}
                        rowKey={(l) => l.id}
                        skeletonRows={6}
                        columns={[
                            { key: "book", header: "Book", primary: true, cell: (l) => <BookCell loan={l} /> },
                            { key: "borrower", header: "Borrower", cell: (l) => l.borrower?.name ?? <span className="text-muted">{shortId(l.borrowerId)}</span> },
                            { key: "issued", header: "Issued", cell: (l) => formatDate(l.borrowedAt) },
                            { key: "due", header: "Due", cell: (l) => formatDate(l.dueDate) },
                            { key: "status", header: "Status", cell: (l) => <StatusBadge loan={l} /> },
                            {
                                key: "actions",
                                header: "Actions",
                                srOnlyHeader: true,
                                align: "right",
                                cell: (l) => (l.returnedAt ? null : <ReturnButton loan={l} busy={busyId === l.id} onReturn={markReturned} />),
                            },
                        ]}
                    />
                    <Pagination page={list.page} hasNext={loans.hasNext} busy={loans.isPlaceholderData} count={loans.data?.length} onPage={list.setPage} />
                </>
            )}
            <LendDialog open={lending} onClose={() => setLending(false)} />
        </>
    );
}

function BookCell({ loan }: { loan: Borrowing }) {
    const book = useLoanBook(loan);
    return <span className="font-medium text-ink">{book.title ?? (book.loading ? "…" : shortId(loan.bookId))}</span>;
}

function ReturnButton({ loan, busy, onReturn }: { loan: Borrowing; busy: boolean; onReturn: (loan: Borrowing, title?: string) => void }) {
    const book = useLoanBook(loan);
    return (
        <Button size="sm" variant="secondary" loading={busy} icon={<Undo2 className="size-4" aria-hidden />} onClick={() => onReturn(loan, book.title)} aria-label={`Mark ${book.title ?? "book"} returned`}>
            Return
        </Button>
    );
}

export function StatusBadge({ loan }: { loan: Borrowing }) {
    const status = loanStatus(loan);
    if (status === "returned") return <Badge tone="neutral">Returned {formatDate(loan.returnedAt)}</Badge>;
    if (status === "overdue") return <Badge tone="danger">Overdue {Math.abs(daysUntil(loan.dueDate))}d</Badge>;
    const days = daysUntil(loan.dueDate);
    return <Badge tone="ok">{days <= 1 ? "Due today" : `${days} days left`}</Badge>;
}
