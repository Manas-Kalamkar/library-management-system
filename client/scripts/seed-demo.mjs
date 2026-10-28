#!/usr/bin/env node
// Fills a fresh City Library backend with demo data over its public HTTP API (no DB access needed).
//   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='...' API_URL=http://localhost:5000/api npm run seed
// Safe to re-run: 409 "already exists" responses are skipped.

const API = (process.env.API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!EMAIL || !PASSWORD) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (an existing admin account).");
    process.exit(1);
}

let token = "";
const call = async (path, { method = "GET", body, allow = [] } = {}) => {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok && !allow.includes(res.status)) throw new Error(`${method} ${path} -> ${res.status} ${typeof data === "string" ? data : JSON.stringify(data)}`);
    return { status: res.status, data };
};

const DEMO_PASSWORD = "Library#2024demo";
const AUTHORS = [
    ["Jane Austen", 1775, [["Pride and Prejudice", "Romance", 1813], ["Emma", "Romance", 1815]]],
    ["Mary Shelley", 1797, [["Frankenstein", "Gothic", 1818]]],
    ["Virginia Woolf", 1882, [["Mrs Dalloway", "Modernist", 1925], ["To the Lighthouse", "Modernist", 1927]]],
    ["George Orwell", 1903, [["Nineteen Eighty-Four", "Dystopian", 1949], ["Animal Farm", "Satire", 1945]]],
    ["Italo Calvino", 1923, [["Invisible Cities", "Fiction", 1972]]],
    ["Gabriel García Márquez", 1927, [["One Hundred Years of Solitude", "Magical realism", 1967]]],
    ["Ursula K. Le Guin", 1929, [["The Left Hand of Darkness", "Science fiction", 1969], ["A Wizard of Earthsea", "Fantasy", 1968]]],
    ["Chinua Achebe", 1930, [["Things Fall Apart", "Fiction", 1958]]],
    ["Toni Morrison", 1931, [["Beloved", "Historical", 1987]]],
    ["Octavia E. Butler", 1947, [["Kindred", "Science fiction", 1979]]],
    ["Haruki Murakami", 1949, [["Norwegian Wood", "Fiction", 1987]]],
    ["Arundhati Roy", 1961, [["The God of Small Things", "Fiction", 1997]]],
    ["Chimamanda Ngozi Adichie", 1977, [["Half of a Yellow Sun", "Historical", 2006]]],
];
const BORROWERS = [
    ["Amelia Hart", "amelia.hart@example.com", "5550100101"],
    ["Daniel Okafor", "daniel.okafor@example.com", "5550100102"],
    ["Priya Raman", "priya.raman@example.com", "5550100103"],
    ["Lucas Moreau", "lucas.moreau@example.com", "5550100104"],
    ["Sofia Lindqvist", "sofia.lindqvist@example.com", "5550100105"],
];

const all = async (path, search) => (await call(`${path}?search=${encodeURIComponent(search)}&limit=5`)).data;

const login = await call("/auth/login", { method: "POST", body: { email: EMAIL, password: PASSWORD } });
token = login.data.accessToken;
console.log(`Signed in as ${login.data.user.email}`);

for (const [name, birthYear, books] of AUTHORS) {
    await call("/authors", { method: "POST", body: { name, birthYear }, allow: [409] });
    const found = (await all("/authors", name)).find((a) => a.name === name);
    if (!found) { console.warn(`  ! could not find author ${name}`); continue; }
    for (const [title, genre, publishedYear] of books) {
        const existing = (await all("/books", title)).find((b) => b.title === title);
        if (!existing) await call("/books", { method: "POST", body: { title, genre, publishedYear, authorId: found.id, available: true } });
    }
    console.log(`  ✓ ${name} (${books.length})`);
}

const librarianEmail = "mira.santos@example.com";
await call("/librarians", { method: "POST", body: { name: "Mira Santos", email: librarianEmail, password: DEMO_PASSWORD, salary: 52000, joiningYear: 2019 }, allow: [409] });
for (const [name, email, phoneNo] of BORROWERS) await call("/borrowers", { method: "POST", body: { name, email, password: DEMO_PASSWORD, phoneNo }, allow: [409] });
console.log("  ✓ staff and members");

const librarian = (await all("/librarians", librarianEmail))[0];
const borrowers = [];
for (const [, email] of BORROWERS) { const b = (await all("/borrowers", email))[0]; if (b) borrowers.push(b); }

const day = 86_400_000;
const loans = [
    ["Beloved", 0, -20, -6],           // overdue
    ["Frankenstein", 1, -3, 4],
    ["Invisible Cities", 2, -1, 6],
    ["Kindred", 3, -9, -2],            // overdue
    ["Mrs Dalloway", 4, -12, -5, true], // returned
];
for (const [title, who, issued, due, returned] of loans) {
    const book = (await all("/books", title)).find((b) => b.title === title);
    if (!book || !book.available || !borrowers[who] || !librarian) continue;
    const created = await call("/borrowings", {
        method: "POST",
        body: { bookId: book.id, borrowerId: borrowers[who].id, librarianId: librarian.id, dueDate: new Date(Date.now() + due * day).toISOString(), borrowedAt: new Date(Date.now() + issued * day).toISOString() },
        allow: [400, 409],
    });
    if (returned && created.data?.id) await call(`/borrowings/${created.data.id}`, { method: "PATCH", body: { returnedAt: new Date(Date.now() + (due - 1) * day).toISOString() } });
}
console.log("  ✓ loans");
console.log(`\nDone. Demo members and the librarian sign in with password: ${DEMO_PASSWORD}`);
