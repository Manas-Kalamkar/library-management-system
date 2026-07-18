import path from "path";
import type { BookQuery } from "../controllers/book.controller.js";
import { type Book, type BookBody } from "../types.js"
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const filePath = path.join(__dirname, "../books.json");

const books: Book[] = JSON.parse(await readFile(filePath, "utf8"));


export const getAllBookService = (id: number): Book => {

    const book = books.find(book => book.id === id);

    if (!book) {
        throw new Error("Book Not Found")
    }

    return book;
}


export const addBookService = (data: BookBody) => {

    if (!data) {
        throw new Error("Add appropriate data")
    }
    return books.push({ id: books.length + 1, ...data })
}

export const updateBookService = (id: number, data: any) => {

    const bookIndex = books.findIndex(book => book.id === id);
    console.log(bookIndex)

    if (bookIndex < 0) {
        throw new Error("Book Not Found")
    }
    if (!data) {
        throw new Error("Add appropriate data")
    }
    const book = books[bookIndex]
    if (!book) {
        throw new Error("Book Not Found")
    }
    Object.assign(book, data)
}

export const deleteBookService = (id: number) => {
    const bookIndex = books.findIndex(book => book.id === id);

    if (bookIndex === -1) throw new Error("Book Not Found");
    console.log(bookIndex)
    books.splice(bookIndex, 1);

    return books
}


export const getBooksByQueryService = (query: BookQuery): Book[] => {

    let filteredSortedBooks = books.filter(book => {
        const titleMatch = !query.title || book.title.toLocaleLowerCase().includes(query.title.toLocaleLowerCase());
        const authorMatch = !query.author || book.author.toLocaleLowerCase().includes(query.author.toLocaleLowerCase());
        const genreMatch = !query.genre || book.genre.toLocaleLowerCase().includes(query.genre.toLocaleLowerCase());
        const availablityMatch = !query.available || book.available.toLocaleLowerCase().includes(query.available.toLocaleLowerCase());

        return titleMatch && authorMatch && genreMatch && availablityMatch
    })
    const sortedBy = query.sortedBy;
    const order = query.order;

    if (sortedBy === 'publishedYear' && order === 'desc') filteredSortedBooks = filteredSortedBooks.sort((book1, book2) => Number(book2.publishedYear) - Number(book1.publishedYear));
    if (sortedBy === 'publishedYear' && order === 'asc') filteredSortedBooks = filteredSortedBooks.sort((book1, book2) => Number(book1.publishedYear) - Number(book2.publishedYear));


    return filteredSortedBooks
}


export const borrowBookService = async (id: number, data: { borrowerName: string, borrowedDate: string }) => {

    const book = books.find(book => book.id === id);
    if (!book) throw new Error("Book not found");

    if (book.available === "No") throw new Error("Book is already borrowed.")

    book.available = "No";
    book.borrowerName = data.borrowerName;
    book.borrowedDate = data.borrowedDate;

    console.log(book)

    return `Book ${book.title} is borrowed by ${book.borrowerName} on ${book.borrowedDate}.`
}

