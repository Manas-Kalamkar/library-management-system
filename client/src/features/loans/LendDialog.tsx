import { useState } from "react";
import { Calendar } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { searchBooks } from "@/api/books";
import { searchBorrowers } from "@/api/borrowers";
import { useBorrowingMutations } from "@/api/borrowings";
import { searchLibrarians } from "@/api/librarians";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";
import { ApiError, errorMessage } from "@/lib/api";
import { addDays, endOfLocalDay, formatDate, toDateInput } from "@/lib/format";
import type { Book, Borrower, Librarian } from "@/lib/types";

interface Props {
    open: boolean;
    onClose: () => void;
    /** pre-select a book (when lending from the catalogue) */
    book?: Book | null;
}

const LOAN_DAYS = 7;

export function LendDialog({ open, onClose, book: initialBook }: Props) {
    return (
        <Dialog open={open} onClose={onClose} title="Lend a book" description={`Loans are due after ${LOAN_DAYS} days unless you pick another date.`}>
            <LendForm onClose={onClose} initialBook={initialBook ?? null} />
        </Dialog>
    );
}

function LendForm({ onClose, initialBook }: { onClose: () => void; initialBook: Book | null }) {
    const { user } = useAuth();
    const toast = useToast();
    const { create } = useBorrowingMutations();
    const isAdmin = user?.role === "ADMIN";

    const [book, setBook] = useState<Book | null>(initialBook);
    const [borrower, setBorrower] = useState<Borrower | null>(null);
    const [librarian, setLibrarian] = useState<Librarian | null>(null);
    const [due, setDue] = useState(toDateInput(addDays(LOAN_DAYS)));
    const [errors, setErrors] = useState<{ book?: string; borrower?: string; librarian?: string; due?: string; form?: string }>({});

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const next: typeof errors = {};
        if (!book) next.book = "Choose the book being lent";
        if (!borrower) next.borrower = "Choose who is borrowing it";
        if (isAdmin && !librarian) next.librarian = "Choose the librarian handling this loan";
        if (!due || new Date(endOfLocalDay(due)) <= new Date()) next.due = "Pick a due date after today";
        setErrors(next);
        if (Object.keys(next).length || !book || !borrower) return;

        try {
            await create.mutateAsync({ bookId: book.id, borrowerId: borrower.id, librarianId: librarian?.id, dueDate: endOfLocalDay(due) });
            toast.success(`Lent “${book.title}” to ${borrower.name}, due ${formatDate(endOfLocalDay(due))}.`);
            onClose();
        } catch (error) {
            if (error instanceof ApiError && error.status === 409) setErrors({ book: "This book is already out on loan." });
            else setErrors({ form: errorMessage(error) });
        }
    };

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            {errors.form ? (
                <div role="alert" className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-3 text-sm text-danger">
                    {errors.form}
                </div>
            ) : null}
            <Combobox<Book>
                label="Book"
                value={book}
                onChange={setBook}
                search={(q, signal) => searchBooks(q, signal, true)}
                getKey={(b) => b.id}
                getLabel={(b) => b.title}
                getHint={(b) => `${b.genre}, ${b.publishedYear}`}
                placeholder="Search books on the shelf"
                emptyText="No available books match"
                error={errors.book}
                disabled={initialBook !== null}
            />
            <Combobox<Borrower>
                label="Borrower"
                value={borrower}
                onChange={setBorrower}
                search={searchBorrowers}
                getKey={(b) => b.id}
                getLabel={(b) => b.name}
                getHint={(b) => b.user.email}
                placeholder="Search by name, email or phone"
                error={errors.borrower}
            />
            {isAdmin ? (
                <Combobox<Librarian>
                    label="Handled by"
                    value={librarian}
                    onChange={setLibrarian}
                    search={searchLibrarians}
                    getKey={(l) => l.id}
                    getLabel={(l) => l.name}
                    getHint={(l) => l.user.email}
                    placeholder="Search librarians"
                    error={errors.librarian}
                />
            ) : null}
            <TextField label="Due date" type="date" value={due} min={toDateInput(addDays(1))} onChange={(e) => setDue(e.target.value)} error={errors.due} trailing={<Calendar className="pointer-events-none mr-2 size-4 text-muted" aria-hidden />} inputClassName="[&::-webkit-calendar-picker-indicator]:opacity-0" />
            <DialogFooter>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" loading={create.isPending}>
                    Lend book
                </Button>
            </DialogFooter>
        </form>
    );
}
