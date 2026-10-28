export type Role = "BORROWER" | "LIBRARIAN" | "ADMIN";

export interface User {
    id: string;
    email: string;
    userName: string;
    role: Role;
}

export interface AuthSession {
    user: User;
    accessToken: string;
    tokenType: "Bearer";
    expiresIn: number;
}

export interface Author {
    id: string;
    name: string;
    birthYear: number;
}

export interface Book {
    id: string;
    title: string;
    genre: string;
    publishedYear: number;
    available: boolean;
    authorId: string;
    /** Present when the API includes it (see backend-patch); otherwise resolved with a lookup. */
    author?: { id: string; name: string } | null;
}

export interface Borrower {
    id: string; // borrower profile id (used by loans)
    userId: string; // user id (used in /borrowers/:id URLs)
    name: string;
    phoneNo: string;
    joiningDate: string;
    user: { id: string; email: string; userName: string };
}

export interface Librarian {
    id: string; // librarian profile id (used by loans)
    userId: string; // user id (used in /librarians/:id URLs)
    name: string;
    salary: number;
    joiningYear: number;
    user: { id: string; email: string; userName: string };
}

export interface Borrowing {
    id: string;
    bookId: string;
    borrowerId: string;
    librarianId: string;
    borrowedAt: string;
    dueDate: string;
    returnedAt: string | null;
    book?: { id: string; title: string } | null;
    borrower?: { id: string; name: string } | null;
    librarian?: { id: string; name: string } | null;
}

export const isStaff = (role: Role | undefined) => role === "LIBRARIAN" || role === "ADMIN";
