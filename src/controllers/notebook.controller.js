import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Notebook } from "../models/notebook.model.js"

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

export { 
    createNotebook,
    getNotebooks
}