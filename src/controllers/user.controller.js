import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { response } from "express";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId); // find user 1st
    const accessToken = user.generateAccessToken(); // they are methods o bracjets are required
    const refreshToken = user.generateRefreshToken(); //refresh tokens are stored in DB because they are long lived tokens

    user.refreshToken = refreshToken; // we have to save the refresh token in DB
    await user.save({ validateBeforeSave: false }); // we are not validating the user before saving

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something Went wrong while generating refresh and access tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //     message:"hurrayyy!! its workingg!!!! "
  // })4

  //get user details from fontend
  //validation - not empty
  // check if user already exists:username, email
  // check for images, check for avatar
  //if available: upload them to cloudinary, avatar
  //create user object (why?) - create entry in db
  //response as it is milega , so remove password and refresh token field from repsonse
  //check for user creation
  // return res

  const { fullName, email, username, password } = req.body; // req me json se data ayega
  console.log("email: ", email);
  /*  if( fullName === "")
      {
        throw new ApiError("Full name is required", 400);
      }
       here we have to check individually by applying if on each parameters 
        BEST WAY:
       */
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError("All fields are required", 400);
  }
  //yeh sab fields hai toh ab check karenge ki yeh email ya username already exist toh nahi karta

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError("User already exists", 400);
  }
  // req.body se saara adata ata hai, middleware request ke andr aur fields add krta hai
  // multer gives the access of files
  // the path uploaed by multer will be available
  console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path; // taken multiple files because we are providing options to user to select from multiple files
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  //upload to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError("User creation failed", 500);
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body-> data
  //username or email
  // ffind the user
  // password check
  // access and refreh token
  //send cookie
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    // returns the 1st entry from DB,
    $or: [{ username }, { email }], // mongo db operators, finds data on the basis of username or email
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  //User: it is the object of the mongo db mongoose
  // hmara "user" hai
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  ); // we are passing user id to generate tokens
  // const { accessToken, refreshToken } is way to extract multiple properties from an object

  //we don't want to send password and refresh token to the user because they are sensitive information
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
    //select includes what we dont want
  );
  //we are sending cookies below
  const options = {
    httpOnly: true, // it  means you can only  modify the cookie from the server
    secure: true, // it means the cookie will only be sent over HTTPS
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken, // we are sending the refresh token as a cookie, user wants to save both token by own
        }, // it means we are sending the user details along with the tokens

        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //remove cookie,
  // reset refresh token
  // if you have true login access of refresh and access token -> if yes then i will add the new object to req: req.user

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (incomingRereshToken) {
    throw new ApiError(401, "unauthorized request ");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (!incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used ");
    }

    const options = {
      httpOnly: true,
      secure: true,
    }; // option likhe hain

    // options ke baad generate krte hain
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id); //ye accesstoken ,rt response me jata hai
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "INVALID REFRESHTOKEN request");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  //yha pe sirf ek file chahiye
  const avatarLocalPath = req.file?.path;

  if (!avatarLoacalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  // TODO: delete old image - assignment

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  //yha pe sirf ek file chahiye
  const coverImageLocalPath = req.file?.path;

  if (!avatarLoacalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on cover Image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params; // from url we get thw username

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  // 1st we will find the document from the username using query

  // direct use of aggregate pipeline
 const channel= await User.aggregate([
    {
      $match: { username: username?.toLowerCase() }, // finds 1 document
    },
    {
      $lookup:{
        from: "subscriptions" , // in model: lowercase and plural
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
       from: "subscriptions" , // in model: lowercase and plural
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      },
      
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        channelsSubscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else: false
          }
        }
      }
    },
    {  //project will show only selected stuffs , passon value ko 1 de do
      $project:{
        fullName:1,
        username:1,
        subscribersCount:1,
        channelSubscribedTocount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }
  ]);
  // we get arrays as a value from aggregate pipeline

if(!channel?.length)
{
  throw new ApiError(404, "Channel does not exists")

}
return res
.status(200)
.json(
  new ApiResponse(200,channel[0],"User channel fetched successfully")
)

});

const getWatchHistory = asyncHandler(async(req,res) => 
{
 const user = await User.aggregate([


  {
    $match:{
      _id:new mongoose.Types.ObjectId(req.user._id)
    }
  },
  {
    $lookup:{
      from :"videos",
      localField:"watchHistory",
      foreignField:"_id",
      as:"watchHistory",
      pipeline: [
        {
          $lookup: {
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline: [

            {
              $project:{
                fullName: 1,
                username: 1,
                avatar: 1
              }
            }
            ]
          }
        },
        {
          $addFields:{
            owner:{
              //we can use array element at
              $first:"$owner"
            }
          }
        }
      ]
    }
  }
 ])  



 return res
 .status(200)
 .json
 (
  new ApiResponse(200,
    user[0].watchHistory,
    "watch history fetched successfully"
  )
 )
  // it will get you the mongo id  mongoose BTS change it to mongodb ,id it will give string.
})



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getWatchHistory
};

// detailed summary of above
// The above code exports two functions, registerUser and loginUser, which handle user registration and login respectively.
// Both functions use async/await syntax for handling asynchronous operations and return appropriate API responses using the ApiResponse class.
