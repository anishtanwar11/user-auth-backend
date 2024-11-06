import mongoose from "mongoose";

const notebookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        section: [{
            type: mongoose.Schema.Types.ObjectId, // Array of Section references
            ref: "Section"
        }],
        user: {
            type: mongoose.Schema.Types.ObjectId, // Reference to the User model
            ref: "User",
            required: true
        }
    },
    {timestamps: true})

export const Notebook = mongoose.model("Notebook", notebookSchema);