import dotenv from "dotenv";
dotenv.config();

import dbConnect from "./src/db/mongodb.js";
import { app } from "./app.js";

const port = process.env.PORT || 5000;

dbConnect()
.then(
    app.listen(port, () => {
        console.log("Server is running on http://localhost:" + port);
    }))
.catch( (err) => {
    console.log("MongoDB connection error !!", err)
})
