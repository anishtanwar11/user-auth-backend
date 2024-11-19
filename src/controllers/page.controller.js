import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Section } from "../models/section.model.js"
import { Page } from "../models/page.model.js"

const getPages = asyncHandler(async (req, res) => {
    const { sectionId } = req.params;
    console.log("Section Id-", sectionId)
    if(!sectionId){
        throw new ApiError(400, "Section Id is required")
    }

    const pages = await Page.find({section: sectionId})
    if(!pages || pages.length === 0){
        throw new ApiError(404, "No pages found found for this section")
    }

    console.log("Pages-", pages)
    return res.status(200).json(
        new ApiResponse(200, pages, "Pages retrieved successfully")
    )
})

const createPage = asyncHandler(async (req, res) => {
    const { sectionId } = req.params;

    console.log("sectionId-",sectionId )

    const section = await Section.findById(sectionId);
    if(!section){
        throw new ApiError(404, "Section not found");
    }

    const page = new Page({
        title: "Untitled Page",
        content: "",
        section: sectionId 
    })
    await page.save();

    section.page.push(page._id);
    await section.save();

    return res.status(201).json(
        new ApiResponse(201, page, "Page created successfully")
    );
})

const updatePageContent = asyncHandler(async (req, res) => {
    const { pageID } = req.params;
    const { content } = req.body;
    const { pageTitle } = req.body;

    if(!pageID){
        throw new ApiError(400, "Page ID is required")
    }

    const page = await Page.findByIdAndUpdate(
        pageID,
        { content, title: pageTitle }, 
        { new: true }
    );

    if (!page) {
        throw new ApiError(404, "Failed to update page content");
    }

    res.status(200).json(
        new ApiResponse(200, page , "Page updated successfully")
    );
})

const deletePage = asyncHandler(async (req, res) => {
    const { pageID } = req.params;

    if(!pageID){
        throw new ApiError(400, "Page ID is required")
    }

    const page = await Page.findByIdAndDelete(pageID)
    if(!page){
        throw new ApiError(404, "Page not found")
    }

    const sectionId = page.section;

    // Delete Page
    await Page.findByIdAndDelete(pageID);

    // Remove the page ID from the associated section's page array
    await Section.findByIdAndUpdate(sectionId, {
        $pull: {page: pageID}
    })

    return res.status(200).json(
        new ApiResponse(200, null, "Page deleted Successfully")
    )
})

export {
    getPages,
    createPage,
    updatePageContent,
    deletePage
}