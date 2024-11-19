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
        title: "Untitled Page",
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

const updateSection = asyncHandler (async (req, res) => {
    const { sectionId } = req.params;
    const { title } = req.body;

    if(!sectionId || !title){
        throw new ApiError(400, "SectionId & Title is required")
    }

    const section = await Section.findByIdAndUpdate(sectionId, {title}, {new: true});
    if(!section){
        throw new ApiError(404, "Error occure during section title is updating")
    }

    return res.status(200).json(
        new ApiResponse(200, section, "Section title updated successfully")
    )
})

const deleteSection = asyncHandler (async (req, res) => {
    const { sectionId } = req.params;
    if(!sectionId){
        throw new ApiError(400, "Section ID is required")
    }

    // Find the section by ID
    const section = await Section.findById(sectionId)
    if(!section){
        throw new ApiError(404, "Section ID required")
    }

    // Remove the section reference from the notebook
    const notebookId = section.notebook;
    await Notebook.findByIdAndUpdate(notebookId, {
        $pull: {section: sectionId}
    })

    // Delete all pages associated with the section
    const pageIds = section.page;
    for(const pageId of pageIds){
        await Page.findByIdAndDelete(pageId);
    }

    await Section.findByIdAndDelete(sectionId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Section and its pages deleted")
    )
})

export {
    createSection,
    getSection,
    updateSection,
    deleteSection
}