import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./src/utils/ApiError.js";

const app = express()

app.use(express.json({limit: "1mb"}))
app.use(express.urlencoded({extended: true, limit: "1mb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}))

// Route Import
import userRouter from "./src/routes/auth.route.js"
import notebookRouter from "./src/routes/notebook.route.js"

// Define Route
app.use("/api/v1/user", userRouter)

app.use("/api/v1/notebook", notebookRouter)

app.use((err, req, res, next) => {
    console.error(err); // Log the error for debugging
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
});

export { app }