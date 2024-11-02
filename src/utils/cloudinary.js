import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { error } from "console";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (fileBuffer, filename) => {
    try {
        if(!fileBuffer) return null;

        const response = await cloudinary.uploader.upload_stream(
            {resource_type: "auto", public_id:filename},
            (error, result) => {
                if (error) throw new Error(error.message);
                return result;
            }
        ).end(fileBuffer);

        return response;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        return null
    }
}

const destroyFromCloudinary = async (publicId) => {
    try {
      if (!publicId) return null;
  
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      return null;
    }
};  

export { uploadOnCloudinary, destroyFromCloudinary }