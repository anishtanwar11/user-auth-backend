import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Notebook } from "../models/notebook.model.js"
import { Section } from "../models/section.model.js";
import { Page } from "../models/page.model.js";

const createNotebook = asyncHandler (async (req, res) => {
    const userId = req.user._id;
    const { title } = req.body;

    if(!title){
        throw new ApiError(400, "Notebook title is required")
    }

    // Check if the notebook with the same name already exists for the logged-in user
    const existingNotebook = await Notebook.findOne({ 
        user: userId,
        title: { $regex: new RegExp(`^${title}$`, 'i')} // Case-insensitive search
    });

    // If a notebook with the same name already exists, throw an error
    if (existingNotebook) {
        throw new ApiError(409, "You already have a notebook with that name. Try a different name.");
    }

    const notebook = await Notebook.create({
        title,
        user: userId
    })
    if(!notebook){
        throw new ApiError(409, "Notebook creation failed")
    }

    const defaultsection = await Section.create({
        title: "Untitled Section",
        notebook: notebook._id,
    })
    if(!defaultsection){
        throw new ApiError(409, "Section creation failed")
    }

    notebook.section.push(defaultsection._id);
    await notebook.save();

    const defaultPage = await Page.create({
        title: "Untitled page",
        content: "",
        section: defaultsection._id,
    })
    if(!defaultPage){
        throw new ApiError(409, "Page creation failed")
    }

    defaultsection.page.push(defaultPage._id);
    await defaultsection.save();

    return res.status(200).json(
        new ApiResponse(200, notebook, "Notebook created successfully")
    )
})

const getNotebooks = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if(!userId){
        throw new ApiError(400, "User Id required")
    }

    const notebooks = await Notebook.find({ user: userId});

    if(!notebooks || notebooks.length === 0){
        throw new ApiError(404, "No notebooks found for this user");
    }

    return res.status(200).json(
        new ApiResponse(200, notebooks, "Notebooks retrieved successfully")
    )
})

const updateNotebook = asyncHandler(async (req, res) => {
    const { notebookId } = req.params;
    const { title } = req.body;

    if(!notebookId || !title){
        throw new ApiError(400, "Notebook Id and title is required")
    }

    const notebook = await Notebook.findByIdAndUpdate(
        notebookId, 
        {title}, 
        {new: true}
    );
    if(!notebook){
        throw new ApiError(404, "Notebook title updation is failed")
    }

    return res.status(200).json(
        new ApiResponse(200, notebook, "Notebook is updated successfully")
    )
})

const deleteNotebook = asyncHandler(async (req, res) => {
    const { notebookId } = req.params;
    if(!notebookId){
        throw new ApiError(400, "Notebook Id is required")
    }

    // Find notebook
    const notebook = await Notebook.findById(notebookId);
    if(!notebook){
        throw new ApiError(404, "Notebook note found")
    }

    // Fetch all section IDs in the notebook
    const sectionIds = notebook.section;

    // Find and delete all pages within each section
    for(const sectionId of sectionIds){
        const section = await Section.findById(sectionId)
        const pageIds = section.page;
        await Page.deleteMany({ _id: { $in: pageIds } });
    }

    // Delete all sections associated with the notebook
    await Section.deleteMany({ _id: { $in: sectionIds } });
    
    await Notebook.findByIdAndDelete(notebookId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Notebook, its sections, and pages deleted successfully")
    )
})

export { 
    createNotebook,
    getNotebooks,
    updateNotebook,
    deleteNotebook
}