import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
});

import express from "express";

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
    res.json("Hello Anish Tanwar")
})

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("Server is running on http://localhost:" + port);
})