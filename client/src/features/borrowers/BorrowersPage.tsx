import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBorrowerMutations, useBorrowers } from "@/api/borrowers";
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
import { formatDate } from "@/lib/format";
import type { Borrower } from "@/lib/types";
import { passwordRule } from "../auth/SignupPage";

const base = z.object({
    name: z.string().trim().min(1, "Enter a name").max(120),
    email: z.string().trim().email("Enter a valid email"),
    phoneNo: z.string().trim().min(5, "Enter a phone number").max(20),
});
const createSchema = base.extend({ password: passwordRule });
const editSchema = base.extend({ password: z.union([z.literal(""), passwordRule]) });
type Values = z.input<typeof createSchema>;

export default function BorrowersPage() {
    useDocumentTitle("Borrowers");
    const toast = useToast();
    const list = useListState();
    const borrowers = useBorrowers({ ...(list.search ? { search: list.search } : {}), sort: "name", order: "asc" }, list.page);
    const { remove } = useBorrowerMutations();
    const [editing, setEditing] = useState<Borrower | null | "new">(null);
    const [deleting, setDeleting] = useState<Borrower | null>(null);

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
            <PageHeader title="Borrowers" description="Members who can take books home." actions={<Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing("new")}>Add borrower</Button>} />
            <SearchInput label="Search borrowers" icon={<Search className="size-4" aria-hidden />} value={list.draft} onChange={(e) => list.setDraft(e.target.value)} placeholder="Name, email or phone" className="mb-5 max-w-sm" />
            {borrowers.isError ? (
                <ErrorState error={borrowers.error} onRetry={() => borrowers.refetch()} />
            ) : !borrowers.isPending && borrowers.data.length === 0 ? (
                <EmptyState title={list.search ? "No borrowers match" : "No borrowers yet"} message={list.search ? "Try a different search." : "Add a member to start lending."} />
            ) : (
                <>
                    <DataTable<Borrower>
                        caption="Borrowers"
                        loading={borrowers.isPending}
                        dimmed={borrowers.isPlaceholderData}
                        rows={borrowers.data ?? []}
                        rowKey={(b) => b.id}
                        columns={[
                            { key: "name", header: "Name", primary: true, cell: (b) => <span className="font-medium text-ink">{b.name}</span> },
                            { key: "email", header: "Email", cell: (b) => b.user.email },
                            { key: "phone", header: "Phone", cell: (b) => b.phoneNo },
                            { key: "joined", header: "Joined", cell: (b) => formatDate(b.joiningDate) },
                            { key: "actions", header: "Actions", srOnlyHeader: true, align: "right", cell: (b) => <RowActions name={b.name} onEdit={() => setEditing(b)} onDelete={() => setDeleting(b)} /> },
                        ]}
                    />
                    <Pagination page={list.page} hasNext={borrowers.hasNext} busy={borrowers.isPlaceholderData} count={borrowers.data?.length} onPage={list.setPage} />
                </>
            )}
            <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing && editing !== "new" ? "Edit borrower" : "Add a borrower"}>
                <BorrowerForm borrower={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
            </Dialog>
            <ConfirmDialog open={deleting !== null} title="Delete this borrower?" message={<>{deleting?.name}'s account and borrowing history will be removed.</>} confirmLabel="Delete borrower" pending={remove.isPending} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </>
    );
}

function BorrowerForm({ borrower, onClose }: { borrower: Borrower | null; onClose: () => void }) {
    const toast = useToast();
    const { create, update } = useBorrowerMutations();
    const [formError, setFormError] = useState<string>();
    const { register, handleSubmit, setError, formState: { errors } } = useForm<Values>({
        resolver: zodResolver(borrower ? editSchema : createSchema),
        defaultValues: { name: borrower?.name ?? "", email: borrower?.user.email ?? "", phoneNo: borrower?.phoneNo ?? "", password: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        setFormError(undefined);
        try {
            if (borrower) {
                const { password, ...rest } = values;
                await update.mutateAsync({ userId: borrower.userId, body: password ? values : rest });
            } else await create.mutateAsync(values);
            toast.success(borrower ? `Saved ${values.name}.` : `Added ${values.name}.`);
            onClose();
        } catch (error) {
            const fields = fieldErrors(error);
            for (const key of ["name", "email", "phoneNo", "password"] as const) if (fields[key]) setError(key, { message: fields[key] });
            if (!Object.keys(fields).length) setFormError(errorMessage(error));
        }
    });

    return (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {formError ? <div role="alert" className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-3 text-sm text-danger">{formError}</div> : null}
            <TextField label="Full name" autoFocus error={errors.name?.message} {...register("name")} />
            <TextField label="Email" type="email" autoComplete="off" error={errors.email?.message} {...register("email")} />
            <TextField label="Phone" type="tel" error={errors.phoneNo?.message} {...register("phoneNo")} />
            <TextField label={borrower ? "New password" : "Password"} type="password" autoComplete="new-password" hint={borrower ? "Leave blank to keep the current password." : undefined} error={errors.password?.message} {...register("password")} />
            <DialogFooter>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={create.isPending || update.isPending}>{borrower ? "Save changes" : "Add borrower"}</Button>
            </DialogFooter>
        </form>
    );
}
