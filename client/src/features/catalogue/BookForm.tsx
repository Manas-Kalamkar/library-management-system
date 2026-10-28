import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { searchAuthors, useAuthor } from "@/api/authors";
import { useBookMutations } from "@/api/books";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";
import { errorMessage, fieldErrors } from "@/lib/api";
import type { Author, Book } from "@/lib/types";

const schema = z.object({
    title: z.string().trim().min(1, "Enter a title").max(200),
    genre: z.string().trim().min(1, "Enter a genre").max(60),
    publishedYear: z.coerce.number({ error: "Enter a year" }).int("Whole years only").min(1, "Enter a year").max(new Date().getFullYear(), "That year is in the future"),
});
type Values = z.input<typeof schema>;

export function BookFormDialog({ open, book, genres, onClose }: { open: boolean; book: Book | null; genres: string[]; onClose: () => void }) {
    return (
        <Dialog open={open} onClose={onClose} title={book ? "Edit book" : "Add a book"}>
            <BookForm book={book} genres={genres} onClose={onClose} />
        </Dialog>
    );
}

function BookForm({ book, genres, onClose }: { book: Book | null; genres: string[]; onClose: () => void }) {
    const toast = useToast();
    const { create, update } = useBookMutations();
    const existing = useAuthor(book?.authorId, !!book && !book.author);
    const [author, setAuthor] = useState<Author | null>(book?.author ? ({ id: book.authorId, name: book.author.name } as Author) : null);
    const [authorError, setAuthorError] = useState<string>();
    const [formError, setFormError] = useState<string>();
    const resolvedAuthor = author ?? existing.data ?? null;

    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { title: book?.title ?? "", genre: book?.genre ?? "", publishedYear: book?.publishedYear ?? ("" as unknown as number) },
    });

    const onSubmit = handleSubmit(async (raw) => {
        const values = schema.parse(raw);
        if (!resolvedAuthor) return setAuthorError("Choose an author");
        setFormError(undefined);
        try {
            const body = { ...values, authorId: resolvedAuthor.id };
            if (book) await update.mutateAsync({ id: book.id, body });
            else await create.mutateAsync(body);
            toast.success(book ? `Saved “${values.title}”.` : `Added “${values.title}” to the catalogue.`);
            onClose();
        } catch (error) {
            const fields = fieldErrors(error);
            for (const key of ["title", "genre", "publishedYear"] as const) if (fields[key]) setError(key, { message: fields[key] });
            if (fields.authorId) setAuthorError(fields.authorId);
            if (!Object.keys(fields).length) setFormError(errorMessage(error));
        }
    });

    return (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {formError ? (
                <div role="alert" className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-3 text-sm text-danger">
                    {formError}
                </div>
            ) : null}
            <TextField label="Title" autoFocus error={errors.title?.message} {...register("title")} />
            <Combobox<Author>
                label="Author"
                value={resolvedAuthor}
                onChange={(a) => {
                    setAuthor(a);
                    setAuthorError(undefined);
                }}
                search={searchAuthors}
                getKey={(a) => a.id}
                getLabel={(a) => a.name}
                placeholder="Search authors"
                error={authorError}
            />
            <div className="grid grid-cols-[1fr_8rem] gap-3">
                <TextField label="Genre" list="genre-options" error={errors.genre?.message} {...register("genre")} />
                <TextField label="Year" inputMode="numeric" error={errors.publishedYear?.message} {...register("publishedYear")} />
            </div>
            <datalist id="genre-options">
                {genres.map((g) => (
                    <option key={g} value={g} />
                ))}
            </datalist>
            <DialogFooter>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" loading={isSubmitting || create.isPending || update.isPending}>
                    {book ? "Save changes" : "Add book"}
                </Button>
            </DialogFooter>
        </form>
    );
}
