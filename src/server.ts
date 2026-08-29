import dotenv from 'dotenv/config';
import app from './app.js';
import prisma, { connectDB } from './config/prisma.js';


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB()
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    })

}


startServer()