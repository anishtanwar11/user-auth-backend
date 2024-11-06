import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            require: true
        },
        content: {
            type: String // Content of the page, possibly HTML from TinyMCE
        },
        section: {
            type: mongoose.Schema.Types.ObjectId, // Reference to the parent section
            ref: "Section",
            required: true
        }
    }, 
    {timestamps: true})

export const Page = mongoose.model("Page", pageSchema)