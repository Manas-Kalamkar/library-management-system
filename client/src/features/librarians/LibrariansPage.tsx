import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLibrarianMutations, useLibrarians } from "@/api/librarians";
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
import { formatNumber } from "@/lib/format";
import type { Librarian } from "@/lib/types";
import { passwordRule } from "../auth/SignupPage";

const base = z.object({
    name: z.string().trim().min(1, "Enter a name").max(120),
    email: z.string().trim().email("Enter a valid email"),
    salary: z.coerce.number({ error: "Enter a salary" }).min(0, "Can't be negative"),
    joiningYear: z.coerce.number({ error: "Enter a year" }).int("Whole years only").min(1950, "Enter a year").max(new Date().getFullYear(), "That year is in the future"),
});
const createSchema = base.extend({ password: passwordRule });
const editSchema = base.extend({ password: z.union([z.literal(""), passwordRule]) });
type Values = z.input<typeof createSchema>;

export default function LibrariansPage() {
    useDocumentTitle("Librarians");
    const toast = useToast();
    const list = useListState();
    const librarians = useLibrarians({ ...(list.search ? { search: list.search } : {}), sort: "name", order: "asc" }, list.page);
    const { remove } = useLibrarianMutations();
    const [editing, setEditing] = useState<Librarian | null | "new">(null);
    const [deleting, setDeleting] = useState<Librarian | null>(null);

    const confirmDelete = async () => {
        if (!deleting) return;
        try {
            await remove.mutateAsync(deleting.userId);
            toast.success(`Removed ${deleting.name}.`);
        } catch (error) {
            toast.error(errorMessage(error));
        }
        setDeleting(null);
    };

    return (
        <>
            <PageHeader title="Librarians" description="Staff accounts. Only administrators can manage them." actions={<Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing("new")}>Add librarian</Button>} />
            <SearchInput label="Search librarians" icon={<Search className="size-4" aria-hidden />} value={list.draft} onChange={(e) => list.setDraft(e.target.value)} placeholder="Name or email" className="mb-5 max-w-sm" />
            {librarians.isError ? (
                <ErrorState error={librarians.error} onRetry={() => librarians.refetch()} />
            ) : !librarians.isPending && librarians.data.length === 0 ? (
                <EmptyState title={list.search ? "No librarians match" : "No librarians yet"} message={list.search ? "Try a different search." : "Add the first staff member."} />
            ) : (
                <>
                    <DataTable<Librarian>
                        caption="Librarians"
                        loading={librarians.isPending}
                        dimmed={librarians.isPlaceholderData}
                        rows={librarians.data ?? []}
                        rowKey={(l) => l.id}
                        columns={[
                            { key: "name", header: "Name", primary: true, cell: (l) => <span className="font-medium text-ink">{l.name}</span> },
                            { key: "email", header: "Email", cell: (l) => l.user.email },
                            { key: "since", header: "Since", cell: (l) => l.joiningYear },
                            { key: "salary", header: "Salary", cell: (l) => formatNumber(l.salary) },
                            { key: "actions", header: "Actions", srOnlyHeader: true, align: "right", cell: (l) => <RowActions name={l.name} onEdit={() => setEditing(l)} onDelete={() => setDeleting(l)} /> },
                        ]}
                    />
                    <Pagination page={list.page} hasNext={librarians.hasNext} busy={librarians.isPlaceholderData} count={librarians.data?.length} onPage={list.setPage} />
                </>
            )}
            <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing && editing !== "new" ? "Edit librarian" : "Add a librarian"}>
                <LibrarianForm librarian={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
            </Dialog>
            <ConfirmDialog open={deleting !== null} title="Delete this librarian?" message={<>{deleting?.name}'s staff account will be removed.</>} confirmLabel="Delete librarian" pending={remove.isPending} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </>
    );
}

function LibrarianForm({ librarian, onClose }: { librarian: Librarian | null; onClose: () => void }) {
    const toast = useToast();
    const { create, update } = useLibrarianMutations();
    const [formError, setFormError] = useState<string>();
    const { register, handleSubmit, setError, formState: { errors } } = useForm<Values>({
        resolver: zodResolver(librarian ? editSchema : createSchema),
        defaultValues: {
            name: librarian?.name ?? "",
            email: librarian?.user.email ?? "",
            salary: librarian?.salary ?? ("" as unknown as number),
            joiningYear: librarian?.joiningYear ?? new Date().getFullYear(),
            password: "",
        },
    });

    const onSubmit = handleSubmit(async (raw) => {
        const schema = librarian ? editSchema : createSchema;
        const values = schema.parse(raw);
        setFormError(undefined);
        try {
            if (librarian) {
                const { password, ...rest } = values;
                await update.mutateAsync({ userId: librarian.userId, body: password ? values : rest });
            } else await create.mutateAsync(values as z.output<typeof createSchema>);
            toast.success(librarian ? `Saved ${values.name}.` : `Added ${values.name}.`);
            onClose();
        } catch (error) {
            const fields = fieldErrors(error);
            for (const key of ["name", "email", "salary", "joiningYear", "password"] as const) if (fields[key]) setError(key, { message: fields[key] });
            if (!Object.keys(fields).length) setFormError(errorMessage(error));
        }
    });

    return (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {formError ? <div role="alert" className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-3 text-sm text-danger">{formError}</div> : null}
            <TextField label="Full name" autoFocus error={errors.name?.message} {...register("name")} />
            <TextField label="Email" type="email" autoComplete="off" error={errors.email?.message} {...register("email")} />
            <div className="grid grid-cols-2 gap-3">
                <TextField label="Salary" inputMode="numeric" error={errors.salary?.message} {...register("salary")} />
                <TextField label="Joining year" inputMode="numeric" error={errors.joiningYear?.message} {...register("joiningYear")} />
            </div>
            <TextField label={librarian ? "New password" : "Password"} type="password" autoComplete="new-password" hint={librarian ? "Leave blank to keep the current password." : undefined} error={errors.password?.message} {...register("password")} />
            <DialogFooter>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={create.isPending || update.isPending}>{librarian ? "Save changes" : "Add librarian"}</Button>
            </DialogFooter>
        </form>
    );
}
