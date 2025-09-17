import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// const getAllVideos = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
//   //TODO: get all videos based on query, sort, pagination
// });

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  // 1. Validate input
  // 2. Check for video file in req.files
  // 3. Upload video to Cloudinary
  // 4. Upload thumbnail to Cloudinary
  // 5. Create video document in database
  // 6. Return response
  if (!title || !description) {
    throw new ApiError(404, "Title and Description are required");
  }
  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  if (!videoLocalPath) {
    throw new ApiError(400, "Video File is required");
  }
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }
  const videoFile = await uploadOnCloudinary(videoLocalPath);
  if (!videoFile) {
    throw new ApiError(400, "failed to upload on cloudinary!");
  }
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(400, "failed to upload on cloudinary!");
  }

  let video;
    try {
        video = await Video.create({
            videoFile: videoFile.url,
            thumbnails: thumbnail.url,
            title,
            description,
            duration: videoFile.duration || 0, // Fallback for duration
            owner: req.user._id
        });

        console.log("Created video:", video);
        console.log("Created video ID:", video._id);
    } catch (createError) {
        console.error("Error creating video:", createError);
        throw new ApiError(500, `Failed to create video: ${createError.message}`);
    }

    console.log("Owner ID:", req.user._id);

    // Fetch the created video with owner details
    const createdVideo = await Video.findById(video._id).populate(
        "owner", 
        "username fullName avatar"
    );

    console.log("CreatedVideo after populate:", createdVideo);

    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while creating video");
    }
  return res
    .status(200)
    .json(new ApiResponse(200, createdVideo, "Video published Successfully!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if(!videoId)
  {
    throw new ApiError(400, "Video doesnt exist| found");
  }
  const video = await Video.findById(videoId)
  if(!video)
  {
    throw new ApiError(400, "Video not found");
  }
  return res
  .status(200)
  .json(new ApiResponse(200,video,"Video found"));
});

// const updateVideo = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   //TODO: update video details like title, description, thumbnail
// });

// const deleteVideo = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   //TODO: delete video
// });

// const togglePublishStatus = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
// });

export {
//   getAllVideos,
  publishAVideo,
  getVideoById,
//   updateVideo,
//   deleteVideo,
//   togglePublishStatus,
};
