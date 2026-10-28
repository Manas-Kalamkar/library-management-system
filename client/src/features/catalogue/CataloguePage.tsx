import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { BookOpen, Plus, Search } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useBookAuthor, useBookMutations, useBooks, type BookFilters, type BookSort } from "@/api/books";
import { BookCover } from "@/components/BookCover";
import { Button } from "@/components/ui/Button";
import { CompactSelect, SearchInput } from "@/components/ui/Fields";
import { Badge, EmptyState, ErrorState, PageHeader, Pagination, Segmented, Skeleton } from "@/components/ui/Display";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { useDebounced } from "@/hooks/useDebounced";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { errorMessage } from "@/lib/api";
import { isStaff, type Book } from "@/lib/types";
import { LendDialog } from "../loans/LendDialog";
import { BookDialog } from "./BookDialog";
import { BookFormDialog } from "./BookForm";

type Availability = "all" | "true" | "false";
const SORTS: Record<string, { sort: BookSort; order: "asc" | "desc"; label: string }> = {
    "title-asc": { sort: "title", order: "asc", label: "Title A–Z" },
    "title-desc": { sort: "title", order: "desc", label: "Title Z–A" },
    "year-desc": { sort: "publishedYear", order: "desc", label: "Newest first" },
    "year-asc": { sort: "publishedYear", order: "asc", label: "Oldest first" },
    "genre-asc": { sort: "genre", order: "asc", label: "Genre" },
};

export default function CataloguePage() {
    useDocumentTitle("Catalogue");
    const { user } = useAuth();
    const staff = isStaff(user?.role);
    const toast = useToast();
    const [params, setParams] = useSearchParams();

    const search = params.get("q") ?? "";
    const genre = params.get("genre") ?? "";
    const availability = (params.get("show") as Availability | null) ?? "all";
    const sortKey = params.get("sort") && SORTS[params.get("sort")!] ? params.get("sort")! : "title-asc";
    const page = Math.max(1, Number(params.get("page")) || 1);

    const [searchDraft, setSearchDraft] = useState(search);
    const [genreDraft, setGenreDraft] = useState(genre);
    const debouncedSearch = useDebounced(searchDraft, 300);
    const debouncedGenre = useDebounced(genreDraft, 300);

    const update = (patch: Record<string, string | null>, resetPage = true) =>
        setParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
                if (resetPage) next.delete("page");
                return next;
            },
            { replace: true },
        );

    // keep the URL in step with the debounced inputs
    useEffect(() => {
        if (debouncedSearch !== search && debouncedSearch === searchDraft) update({ q: debouncedSearch || null });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);
    useEffect(() => {
        if (debouncedGenre !== genre && debouncedGenre === genreDraft) update({ genre: debouncedGenre || null });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedGenre]);

    const sorting = SORTS[sortKey]!;
    const filters: BookFilters = {
        sort: sorting.sort,
        order: sorting.order,
        ...(search ? { search } : {}),
        ...(genre ? { genre } : {}),
        ...(availability !== "all" ? { available: availability } : {}),
    };
    const books = useBooks(filters, page);
    const genres = useMemo(() => [...new Set((books.data ?? []).map((b) => b.genre))].sort(), [books.data]);

    const [selected, setSelected] = useState<Book | null>(null);
    const [editing, setEditing] = useState<Book | null | "new">(null);
    const [lending, setLending] = useState<Book | null>(null);
    const [deleting, setDeleting] = useState<Book | null>(null);
    const { remove } = useBookMutations();

    const confirmDelete = async () => {
        if (!deleting) return;
        try {
            await remove.mutateAsync(deleting.id);
            toast.success(`Removed “${deleting.title}”.`);
            setDeleting(null);
        } catch (error) {
            toast.error(errorMessage(error));
            setDeleting(null);
        }
    };

    const filtered = Boolean(search || genre || availability !== "all");

    return (
        <>
            <PageHeader
                title="Catalogue"
                description="Browse the collection, see what is on the shelf and what is out on loan."
                actions={
                    staff ? (
                        <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing("new")}>
                            Add book
                        </Button>
                    ) : null
                }
            />

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <SearchInput label="Search books" icon={<Search className="size-4" aria-hidden />} value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} placeholder="Search by title" className="min-w-52 flex-1 sm:max-w-xs" />
                <SearchInput label="Filter by genre" icon={<BookOpen className="size-4" aria-hidden />} list="genre-filter" value={genreDraft} onChange={(e) => setGenreDraft(e.target.value)} placeholder="Genre" className="w-40" />
                <datalist id="genre-filter">
                    {genres.map((g) => (
                        <option key={g} value={g} />
                    ))}
                </datalist>
                <Segmented<Availability>
                    label="Availability"
                    value={availability}
                    options={[
                        { value: "all", label: "All" },
                        { value: "true", label: "On shelf" },
                        { value: "false", label: "On loan" },
                    ]}
                    onChange={(v) => update({ show: v === "all" ? null : v })}
                />
                <CompactSelect label="Sort books" value={sortKey} onChange={(e) => update({ sort: e.target.value === "title-asc" ? null : e.target.value })} className="ml-auto">
                    {Object.entries(SORTS).map(([key, s]) => (
                        <option key={key} value={key}>
                            {s.label}
                        </option>
                    ))}
                </CompactSelect>
            </div>

            {books.isError ? (
                <ErrorState error={books.error} onRetry={() => books.refetch()} />
            ) : books.isPending ? (
                <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading books">
                    {Array.from({ length: 8 }, (_, i) => (
                        <li key={i}>
                            <Skeleton className="aspect-[2/3] w-full rounded-md" />
                            <Skeleton className="mt-3 h-4 w-3/4" />
                            <Skeleton className="mt-2 h-3 w-1/2" />
                        </li>
                    ))}
                </ul>
            ) : books.data.length === 0 ? (
                <EmptyState
                    title={filtered ? "No books match" : "The shelves are empty"}
                    message={filtered ? "Try a different search or clear the filters." : staff ? "Add the first book to get started." : "Nothing has been catalogued yet."}
                    action={
                        filtered ? (
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setSearchDraft("");
                                    setGenreDraft("");
                                    setParams({}, { replace: true });
                                }}
                            >
                                Clear filters
                            </Button>
                        ) : staff ? (
                            <Button onClick={() => setEditing("new")}>Add book</Button>
                        ) : null
                    }
                />
            ) : (
                <>
                    <ul className={`grid grid-cols-2 gap-x-5 gap-y-8 transition-opacity md:grid-cols-3 xl:grid-cols-4 ${books.isPlaceholderData ? "opacity-60" : ""}`}>
                        {books.data.map((book) => (
                            <li key={book.id}>
                                <BookCard book={book} onOpen={() => setSelected(book)} />
                            </li>
                        ))}
                    </ul>
                    <Pagination page={page} hasNext={books.hasNext} busy={books.isPlaceholderData} count={books.data.length} onPage={(p) => update({ page: p === 1 ? null : String(p) }, false)} />
                </>
            )}

            <BookDialog
                book={selected}
                staff={staff}
                onClose={() => setSelected(null)}
                onLend={(b) => {
                    setSelected(null);
                    setLending(b);
                }}
                onEdit={(b) => {
                    setSelected(null);
                    setEditing(b);
                }}
                onDelete={(b) => {
                    setSelected(null);
                    setDeleting(b);
                }}
            />
            <BookFormDialog open={editing !== null} book={editing === "new" ? null : editing} genres={genres} onClose={() => setEditing(null)} />
            <LendDialog open={lending !== null} book={lending} onClose={() => setLending(null)} />
            <ConfirmDialog open={deleting !== null} title="Delete this book?" message={<>“{deleting?.title}” will be removed from the catalogue. This can't be undone.</>} confirmLabel="Delete book" pending={remove.isPending} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </>
    );
}

function BookCard({ book, onOpen }: { book: Book; onOpen: () => void }) {
    const author = useBookAuthor(book);
    return (
        <button type="button" onClick={onOpen} className="group block w-full text-left">
            <BookCover title={book.title} genre={book.genre} year={book.publishedYear} authorName={author.name} authorLoading={author.loading} dimmed={!book.available} className="transition-transform duration-200 group-hover:-translate-y-1 group-focus-visible:-translate-y-1" />
            <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{book.title}</p>
                    <p className="truncate text-sm text-muted">{author.name ?? (author.loading ? "…" : "Unknown author")}</p>
                </div>
                <Badge tone={book.available ? "ok" : "warn"}>{book.available ? "In" : "Out"}</Badge>
            </div>
        </button>
    );
}
