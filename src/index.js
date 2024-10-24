import dotenv from "dotenv"
dotenv.config()

import express from "express";

const router = express()

router.get('/', (req, res) => {
    res.json("Hello Anish Tanwar")
})

const Port = process.env.PORT || 5000;

router.listen(Port, () => {
    console.log("Server is running on http://localhost:" + Port);
})