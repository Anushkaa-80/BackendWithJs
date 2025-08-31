import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  const avatarLocalPath = req.files?.avatar[0]?.path;
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

  if (!username || !email) {
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

await  User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
     },
    
  },
{
    new: true 
})

  const options ={
    httpOnly: true,
    secure: true
  }
   return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };

// detailed summary of above
// The above code exports two functions, registerUser and loginUser, which handle user registration and login respectively.
// Both functions use async/await syntax for handling asynchronous operations and return appropriate API responses using the ApiResponse class.
