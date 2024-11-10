import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Section } from "../models/section.model.js"
import { Notebook } from "../models/notebook.model.js";
import { Page } from "../models/page.model.js"

const createSection = asyncHandler (async (req, res) => {
    const { title } = req.body;
    const { notebookId } = req.params;

    if (!title) {
        throw new ApiError(400, "Section title is required");
    }
    if(!notebookId){
        throw new ApiError(400, "Notebook Id is required");
    }

    const notebook = await Notebook.findById(notebookId);
    if (!notebook) {
        throw new ApiError(404, "Notebook not found");
    }

    const existingSection = await Section.findOne({
        notebook: notebookId,
        title: { $regex: RegExp(`^${title}$`, 'i')} // Case-insensitive search  
    })
    console.log("existingSection", existingSection);
    
    // If a notebook with the same name already exists, throw an error
    if (existingSection) {
        throw new ApiError(409, "You already have a section with that name. Try a different name.");
    }


    const section = await Section.create({
        title,
        notebook: notebookId
    })

    const defaultPage = await Page.create({
        title: "Untitle Page",
        content: "",
        section: section._id
    }) 

    section.page.push(defaultPage._id)
    await section.save();

    notebook.section.push(section._id)
    await notebook.save();

    return res.status(201).json(
        new ApiResponse(201, section, "Section created successfully")
    );
})

const getSection = asyncHandler (async (req, res) => {
    const { notebookId } = req.params;

    const sections = await Section.find({ notebook: notebookId });
    if (!sections || sections.length === 0) {
        throw new ApiError(404, "No sections found for this notebook");
    }

    return res.status(200).json(
        new ApiResponse(200, sections, "Sections retrieved successfully")
    );
})

export {
    createSection,
    getSection
}