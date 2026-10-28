import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/auth/AuthContext";
import { useAuthorMutations, useAuthors } from "@/api/authors";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog, Dialog, DialogFooter } from "@/components/ui/Dialog";
import { EmptyState, ErrorState, PageHeader, Pagination } from "@/components/ui/Display";
import { SearchInput, TextField } from "@/components/ui/Fields";
import { RowActions } from "@/components/ui/RowActions";
import { useToast } from "@/components/ui/Toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useListState } from "@/hooks/useListState";
import { errorMessage, fieldErrors } from "@/lib/api";
import { isStaff, type Author } from "@/lib/types";

const schema = z.object({
    name: z.string().trim().min(1, "Enter a name").max(120),
    birthYear: z.coerce.number({ error: "Enter a year" }).int("Whole years only").min(1, "Enter a year").max(new Date().getFullYear(), "That year is in the future"),
});
type Values = z.input<typeof schema>;

export default function AuthorsPage() {
    useDocumentTitle("Authors");
    const { user } = useAuth();
    const staff = isStaff(user?.role);
    const toast = useToast();
    const list = useListState();
    const authors = useAuthors({ ...(list.search ? { search: list.search } : {}), sort: "name", order: "asc" }, list.page);
    const { remove } = useAuthorMutations();
    const [editing, setEditing] = useState<Author | null | "new">(null);
    const [deleting, setDeleting] = useState<Author | null>(null);

    const confirmDelete = async () => {
        if (!deleting) return;
        try {
            await remove.mutateAsync(deleting.id);
            toast.success(`Removed ${deleting.name}.`);
        } catch (error) {
            toast.error(errorMessage(error));
        }
        setDeleting(null);
    };

    return (
        <>
            <PageHeader title="Authors" description="Everyone whose work is on the shelves." actions={staff ? <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing("new")}>Add author</Button> : null} />
            <SearchInput label="Search authors" icon={<Search className="size-4" aria-hidden />} value={list.draft} onChange={(e) => list.setDraft(e.target.value)} placeholder="Search by name" className="mb-5 max-w-sm" />
            {authors.isError ? (
                <ErrorState error={authors.error} onRetry={() => authors.refetch()} />
            ) : !authors.isPending && authors.data.length === 0 ? (
                <EmptyState title={list.search ? "No authors match" : "No authors yet"} message={list.search ? "Try a different name." : staff ? "Add an author before cataloguing books." : undefined} />
            ) : (
                <>
                    <DataTable<Author>
                        caption="Authors"
                        loading={authors.isPending}
                        dimmed={authors.isPlaceholderData}
                        rows={authors.data ?? []}
                        rowKey={(a) => a.id}
                        columns={[
                            { key: "name", header: "Name", primary: true, cell: (a) => <span className="font-medium text-ink">{a.name}</span> },
                            { key: "born", header: "Born", cell: (a) => a.birthYear },
                            ...(staff ? [{ key: "actions", header: "Actions", srOnlyHeader: true, align: "right" as const, cell: (a: Author) => <RowActions name={a.name} onEdit={() => setEditing(a)} onDelete={() => setDeleting(a)} /> }] : []),
                        ]}
                    />
                    <Pagination page={list.page} hasNext={authors.hasNext} busy={authors.isPlaceholderData} count={authors.data?.length} onPage={list.setPage} />
                </>
            )}
            <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing && editing !== "new" ? "Edit author" : "Add an author"}>
                <AuthorForm author={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
            </Dialog>
            <ConfirmDialog open={deleting !== null} title="Delete this author?" message={<>{deleting?.name} will be removed. Authors who still have books can't be deleted.</>} confirmLabel="Delete author" pending={remove.isPending} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </>
    );
}

function AuthorForm({ author, onClose }: { author: Author | null; onClose: () => void }) {
    const toast = useToast();
    const { create, update } = useAuthorMutations();
    const [formError, setFormError] = useState<string>();
    const { register, handleSubmit, setError, formState: { errors } } = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { name: author?.name ?? "", birthYear: author?.birthYear ?? ("" as unknown as number) },
    });

    const onSubmit = handleSubmit(async (raw) => {
        const body = schema.parse(raw);
        setFormError(undefined);
        try {
            if (author) await update.mutateAsync({ id: author.id, body });
            else await create.mutateAsync(body);
            toast.success(author ? `Saved ${body.name}.` : `Added ${body.name}.`);
            onClose();
        } catch (error) {
            const fields = fieldErrors(error);
            for (const key of ["name", "birthYear"] as const) if (fields[key]) setError(key, { message: fields[key] });
            if (!Object.keys(fields).length) setFormError(errorMessage(error));
        }
    });

    return (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {formError ? <div role="alert" className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-3 text-sm text-danger">{formError}</div> : null}
            <TextField label="Name" autoFocus error={errors.name?.message} {...register("name")} />
            <TextField label="Birth year" inputMode="numeric" error={errors.birthYear?.message} {...register("birthYear")} />
            <DialogFooter>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={create.isPending || update.isPending}>{author ? "Save changes" : "Add author"}</Button>
            </DialogFooter>
        </form>
    );
}
