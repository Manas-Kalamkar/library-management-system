import { HandCoins, Pencil, Trash2 } from "lucide-react";
import { useBookAuthor } from "@/api/books";
import { BookCover } from "@/components/BookCover";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Display";
import type { Book } from "@/lib/types";

interface Props {
    book: Book | null;
    staff: boolean;
    onClose: () => void;
    onLend: (book: Book) => void;
    onEdit: (book: Book) => void;
    onDelete: (book: Book) => void;
}

export function BookDialog({ book, staff, onClose, onLend, onEdit, onDelete }: Props) {
    return (
        <Dialog open={book !== null} onClose={onClose} title={book?.title ?? "Book"} size="md" hideHeader>
            {book ? <Details book={book} staff={staff} onLend={onLend} onEdit={onEdit} onDelete={onDelete} /> : null}
        </Dialog>
    );
}

function Details({ book, staff, onLend, onEdit, onDelete }: Omit<Props, "onClose" | "book"> & { book: Book }) {
    const author = useBookAuthor(book);
    return (
        <div className="grid gap-6 sm:grid-cols-[11rem_1fr]">
            <BookCover title={book.title} genre={book.genre} year={book.publishedYear} authorName={author.name} authorLoading={author.loading} className="mx-auto w-44 sm:w-full" />
            <div className="flex flex-col">
                <Badge tone={book.available ? "ok" : "warn"}>{book.available ? "On the shelf" : "On loan"}</Badge>
                <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight text-ink">{book.title}</h2>
                <p className="mt-1 text-muted">{author.loading ? "Loading author…" : (author.name ?? "Unknown author")}</p>
                <dl className="mt-5 grid grid-cols-2 gap-y-3 text-sm">
                    <div>
                        <dt className="text-muted">Genre</dt>
                        <dd className="font-medium text-ink">{book.genre}</dd>
                    </div>
                    <div>
                        <dt className="text-muted">Published</dt>
                        <dd className="font-medium text-ink">{book.publishedYear}</dd>
                    </div>
                </dl>
                <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    {staff ? (
                        <>
                            <Button disabled={!book.available} icon={<HandCoins className="size-4" aria-hidden />} onClick={() => onLend(book)}>
                                Lend
                            </Button>
                            <Button variant="secondary" icon={<Pencil className="size-4" aria-hidden />} onClick={() => onEdit(book)}>
                                Edit
                            </Button>
                            <Button variant="ghost" className="text-danger" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => onDelete(book)}>
                                Delete
                            </Button>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
