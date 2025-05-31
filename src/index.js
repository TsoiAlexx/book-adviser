import express from 'express';
import "dotenv/config";
import authRoutes from './routes/authRoutes.js';
import {connectDB} from "./lib/db.js";
import bookRoutes from './routes/bookRoutes.js';

const app = express();
const PORT = process.env.PORT;

//middleware
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use("/api/books", bookRoutes)


app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    connectDB()
})