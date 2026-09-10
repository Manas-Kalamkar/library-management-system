    import { Router } from "express"
    import { getLibrariansController, getLibrarianByIdController, addLibrarianController, deleteLibrarianController, updateLibrarianController } from "../controllers/librarian.controller.js"
    import { removeUndefined, removeUndefinedMiddleware } from "../middlewares/removeUndefined.js"
    import { UpdateLibrarian } from "../schemas/librarian.schema.js"
    import { requireAuth, requireRole } from "../middlewares/auth.js"


    const librarianRouter = Router()


    librarianRouter.get("/",requireAuth,requireRole(["LIBRARIAN","ADMIN"]), getLibrariansController)
    librarianRouter.get("/:id",requireAuth,requireRole(["LIBRARIAN","ADMIN"]), getLibrarianByIdController)
    librarianRouter.post("/",requireAuth,requireRole(["ADMIN"]), addLibrarianController)
    librarianRouter.delete("/:id",requireAuth,requireRole(["ADMIN"]), deleteLibrarianController)

    librarianRouter.patch("/:id",requireAuth,requireRole(["ADMIN"]), removeUndefinedMiddleware(UpdateLibrarian), updateLibrarianController)


    export default librarianRouter