import { Link } from "react-router";
import { buttonLikeClasses } from "@/components/ui/links";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFoundPage() {
    useDocumentTitle("Page not found");
    return (
        <div className="grid place-items-center py-24 text-center">
            <p className="font-serif text-6xl font-semibold text-line-strong">404</p>
            <h1 className="mt-4 text-2xl font-semibold">This page isn't on our shelves</h1>
            <p className="mt-2 text-muted">The address may be mistyped, or the page has moved.</p>
            <Link to="/catalogue" className={`${buttonLikeClasses()} mt-6`}>
                Go to the catalogue
            </Link>
        </div>
    );
}
