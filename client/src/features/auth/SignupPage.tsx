import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Fields";
import { ApiError, errorMessage, fieldErrors } from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AuthLayout } from "./AuthLayout";

export const passwordRule = z
    .string()
    .min(8, "Use at least 8 characters")
    .refine((v) => new TextEncoder().encode(v).length <= 72, "Use at most 72 bytes")
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Include at least one letter and one number");

const schema = z.object({
    userName: z.string().trim().min(1, "Enter your name").max(100, "Use 100 characters or fewer"),
    email: z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email address")),
    phoneNo: z.string().trim().regex(/^\d{10}$/, "Enter a 10-digit phone number"),
    password: passwordRule,
});
type Values = z.infer<typeof schema>;

export default function SignupPage() {
    useDocumentTitle("Create account");
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [formError, setFormError] = useState<string | null>(null);
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null);
        try {
            await signUp(values);
            navigate("/catalogue", { replace: true });
        } catch (error) {
            if (error instanceof ApiError && error.status === 409) {
                setError("email", { message: "An account with this email already exists. Sign in instead." });
                return;
            }
            const serverErrors = fieldErrors(error);
            const keys = Object.keys(serverErrors) as (keyof Values)[];
            if (keys.length) keys.forEach((key) => setError(key, { message: serverErrors[key] }));
            else setFormError(errorMessage(error));
        }
    });

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Borrowers can browse the catalogue and see what's on the shelf."
            footer={
                <>
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium text-brand underline underline-offset-4">
                        Sign in
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
                <TextField label="Full name" autoComplete="name" autoFocus error={errors.userName?.message} {...register("userName")} />
                <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
                <TextField label="Phone number" type="tel" inputMode="numeric" autoComplete="tel-national" hint="10 digits, no spaces" error={errors.phoneNo?.message} {...register("phoneNo")} />
                <TextField label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number" error={errors.password?.message} {...register("password")} />
                <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
                    Create account
                </Button>
            </form>
        </AuthLayout>
    );
}
