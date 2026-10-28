import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { changePassword, deleteAccount } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Badge, PageHeader } from "@/components/ui/Display";
import { TextField } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ApiError, errorMessage, fieldErrors } from "@/lib/api";
import { initials, roleLabel } from "@/lib/format";
import { passwordRule } from "../auth/SignupPage";

const schema = z
    .object({ currentPassword: z.string().min(1, "Enter your current password"), newPassword: passwordRule, confirm: z.string() })
    .refine((v) => v.newPassword === v.confirm, { path: ["confirm"], message: "Passwords don't match" })
    .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a different password" });
type Values = z.infer<typeof schema>;

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-muted">{description}</p>
            <div className="mt-5">{children}</div>
        </section>
    );
}

export default function AccountPage() {
    useDocumentTitle("Account");
    const { user, adoptSession, signOutEverywhere, signOut } = useAuth();
    const toast = useToast();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [everywhere, setEverywhere] = useState(false);

    const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

    if (!user) return null;

    const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
        try {
            const result = await changePassword(currentPassword, newPassword);
            adoptSession(result);
            reset();
            toast.success("Password changed. Other devices have been signed out.");
        } catch (error) {
            if (error instanceof ApiError && (error.status === 401 || error.status === 400) && /current|incorrect|invalid/i.test(error.message)) {
                setError("currentPassword", { message: "That isn't your current password" });
                return;
            }
            const fields = fieldErrors(error);
            if (fields.newPassword) setError("newPassword", { message: fields.newPassword });
            else toast.error(errorMessage(error));
        }
    });

    const doSignOutEverywhere = async () => {
        setEverywhere(true);
        try {
            await signOutEverywhere();
        } catch (error) {
            toast.error(errorMessage(error));
            setEverywhere(false);
        }
    };

    const doDelete = async () => {
        setDeleting(true);
        try {
            await deleteAccount(user.id);
            await signOut().catch(() => undefined);
        } catch (error) {
            toast.error(errorMessage(error));
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <>
            <PageHeader title="Account" description="Your profile and security settings." />
            <div className="grid max-w-2xl gap-6">
                <section className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6">
                    <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-soft font-serif text-lg font-semibold text-brand">
                        {initials(user.email.split("@")[0] ?? user.email)}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{user.email}</p>
                        <div className="mt-1.5">
                            <Badge tone="brand">{roleLabel(user.role)}</Badge>
                        </div>
                    </div>
                </section>

                <Section title="Change password" description="You'll stay signed in here; every other device is signed out.">
                    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                        <TextField label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
                        <TextField label="New password" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register("newPassword")} />
                        <TextField label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />
                        <div>
                            <Button type="submit" loading={isSubmitting}>Update password</Button>
                        </div>
                    </form>
                </Section>

                <Section title="Sessions" description="Signed in on a device you've lost, or just want a clean slate? End every session at once.">
                    <Button variant="secondary" loading={everywhere} icon={<LogOut className="size-4" aria-hidden />} onClick={doSignOutEverywhere}>
                        Sign out everywhere
                    </Button>
                </Section>

                {user.role !== "ADMIN" ? (
                    <Section title="Delete account" description="Permanently removes your account and borrowing history. This can't be undone.">
                        <Button variant="danger" icon={<ShieldAlert className="size-4" aria-hidden />} onClick={() => setConfirmDelete(true)}>
                            Delete my account
                        </Button>
                    </Section>
                ) : null}
            </div>
            <ConfirmDialog open={confirmDelete} title="Delete your account?" message="You'll be signed out and your account and borrowing history will be erased." confirmLabel="Delete account" pending={deleting} onConfirm={doDelete} onClose={() => setConfirmDelete(false)} />
        </>
    );
}
