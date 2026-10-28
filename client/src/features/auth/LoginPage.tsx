import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Button, IconButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Fields";
import { ApiError, errorMessage } from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AuthLayout } from "./AuthLayout";

const schema = z.object({
    email: z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email address")),
    password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

const demo = { email: import.meta.env.VITE_DEMO_EMAIL as string | undefined, password: import.meta.env.VITE_DEMO_PASSWORD as string | undefined };

export default function LoginPage() {
    useDocumentTitle("Sign in");
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? "/catalogue";
    const [formError, setFormError] = useState<string | null>(null);
    const [reveal, setReveal] = useState(false);

    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

    const onSubmit = handleSubmit(async ({ email, password }) => {
        setFormError(null);
        try {
            await signIn(email, password);
            navigate(from, { replace: true });
        } catch (error) {
            if (error instanceof ApiError && error.code === "INVALID_CREDENTIALS") {
                setFormError("That email and password don't match. After 5 wrong attempts the account is locked for 15 minutes.");
            } else {
                setFormError(errorMessage(error));
            }
        }
    });

    return (
        <AuthLayout
            title="Sign in"
            subtitle="Use your library account."
            footer={
                <>
                    New here?{" "}
                    <Link to="/signup" className="font-medium text-brand underline underline-offset-4">
                        Create a borrower account
                    </Link>
                </>
            }
        >
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                {formError ? (
                    <div role="alert" className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-3 text-sm text-danger">
                        {formError}
                    </div>
                ) : null}
                <TextField label="Email" type="email" autoComplete="username" autoFocus error={errors.email?.message} {...register("email")} />
                <TextField
                    label="Password"
                    type={reveal ? "text" : "password"}
                    autoComplete="current-password"
                    error={errors.password?.message}
                    trailing={
                        <IconButton label={reveal ? "Hide password" : "Show password"} onClick={() => setReveal((v) => !v)} className="size-8">
                            {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                        </IconButton>
                    }
                    {...register("password")}
                />
                <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
                    Sign in
                </Button>
                {demo.email && demo.password ? (
                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                            setValue("email", demo.email!, { shouldValidate: true });
                            setValue("password", demo.password!, { shouldValidate: true });
                        }}
                    >
                        Use the demo account
                    </Button>
                ) : null}
            </form>
        </AuthLayout>
    );
}
