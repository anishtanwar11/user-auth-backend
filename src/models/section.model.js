import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        page: [{
            type: mongoose.Schema.Types.ObjectId, // Array of Page references
            ref: "Page"
        }],
        notebook: {
            type: mongoose.Schema.Types.ObjectId, // Reference to the parent notebook
            ref: "Notebook",
            required: true
        }
    }, 
    {timestamps: true})

export const Section = mongoose.model("Section", sectionSchema);