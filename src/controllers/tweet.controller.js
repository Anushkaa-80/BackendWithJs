import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  //1.User input
  //2.VAlidation
  //3.Identify current user
  //4.create tweet

  const { content = "" } = req.body; // by giving "" it makes the trim check safe

  if (typeof content !== "string" || !content.trim()) {
    // non-string/empty/whitespace sab catch ho jata
    throw new ApiError(400, "Content is Empty!!");
  }
  //3.Current User verify
  //User.findById ki zarurat nahi jab tak tumhe extra owner details response me nahi chahiye. Agar chahiye to populate karo    await tweet.populate("owner", "username fullName avatar");
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized");
  }
  //4.Create tweet
  const tweet = await Tweet.create({
    content: content.trim(),
    owner: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet Created Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  //1.fetch user id
  //2.fetch tweet from database

  const userId = req.user._id;
  const fetchTweets = await Tweet.find({ owner: userId }); //find the twwet done by given user id
  return res
    .status(200)
    .json(new ApiResponse(200, fetchTweets, "User tweeet is fetched"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId) {
    throw new ApiError(400, "Tweet doesnt exist");
  }
  if (!content || !content.trim()) {
    throw new ApiError(400, "tweet-Content is required");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet doesnt exist");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }
  // tweet.content = content;  // naya content update karo
  // await tweet.save();        // DB me save karo
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content },
    { new: true } // updated tweet return karega
  );
  return res.status(200).json(
    new ApiResponse(
      200,
      updatedTweet, // ya updatedTweet agar findByIdAndUpdate use kiya
      "Tweet updated successfully"
    )
  );
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
//1.Validate tweet id
  const {tweetId} = req.params;
  if(!tweetId)
    {
        throw new ApiError(400,"Tweet doesnt exist");
        

    }
  //2.Find tweet from DB
    const tweet = await Tweet.findById(tweetId)
    if(!tweet)
    {
        throw new ApiError(404,"Tweet NOt Found");
    }
    //3. Check Ownership
     if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet");}
     // 4. Delete tweet
  await Tweet.findByIdAndDelete(tweetId);

  // 5. Send response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));


});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
