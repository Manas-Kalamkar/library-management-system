
export declare module 'express-session' {
  interface SessionData {
    userId:string;
    data: string;
    role: "BORROWER"|"LIBRARIAN"|"ADMIN";

  }
}