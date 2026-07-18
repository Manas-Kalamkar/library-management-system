export interface Book {
  id: number,
  title: string,
  author: string,
  genre: string,
  publishedYear: string,
  available: "Yes" | "No",
  borrowerName: string | null,
  borrowedDate: string | null
}


export interface BookBody {
  title: string,
  author: string,
  genre: string,
  publishedYear: string,
  available: "Yes" | "No",
  borrowerName: string,
  borrowedDate: string | null

}


export interface BookQuery {
    title?: string,
    author?: string,
    genre?: string,
    available?: "Yes" | "No",
    sortedBy?: string,
    order?: "asc" | "desc"
}
