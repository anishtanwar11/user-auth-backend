import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        if (!fileBuffer) return reject(new Error("File buffer is required"));

        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return reject(new Error(error.message));
                }
                resolve(result); // Result should contain public_id and url
            }
        );

        stream.end(fileBuffer);
    });
};

const destroyFromCloudinary = async (publicId) => {
    try {
      if (!publicId) return null;
  
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      return null;
    }
};  

export { uploadOnCloudinary, destroyFromCloudinary }