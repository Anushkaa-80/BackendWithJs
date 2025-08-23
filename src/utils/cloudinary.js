import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadOnCloudinary(filePath) {
  try {
    if (!filePath) return null;

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    console.log("✅ Upload success:", uploadResult.url);

    // delete local file if exists
    if (filePath.startsWith("./") || filePath.startsWith("uploads")) {
      fs.unlinkSync(filePath);
    }

    return uploadResult;
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error);
    return null;
  }
}
