import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    //1.User input
    //2.VAlidation
    //3.Identify current user
    //4.create tweet

    const {content =""} = req.body; // by giving "" it makes the trim check safe
 
    if(typeof content!=="string" || !content.trim())   // non-string/empty/whitespace sab catch ho jata
    {
        throw new ApiError(400, "Content is Empty!!");
    }
    //3.Current User verify 
    //User.findById ki zarurat nahi jab tak tumhe extra owner details response me nahi chahiye. Agar chahiye to populate karo    await tweet.populate("owner", "username fullName avatar");
    if(!req.user?._id)
    {
        throw new ApiError(401, "Unauthorized");
    }
    //4.Create tweet
    const tweet=await Tweet.create({
        content: content.trim(),
        owner: req.user._id,
    })
    return res
    .status(201)
    .json(new ApiResponse(201,tweet,"Tweet Created Successfully"))
     
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}