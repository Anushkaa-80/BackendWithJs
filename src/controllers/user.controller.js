import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  const { fulName, email, username, password } = req.body; // req me json se data ayega
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

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError("User already exists", 400);
  }
  // req.body se saara adata ata hai, middleware request ke andr aur fields add krta hai
  // multer gives the access of files
  // the path uploaed by multer will be available
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
  })
  const createdUser= await User.findById(user._id).select(
    "-password -refreshToken");
    if(!createdUser)
    {
        throw new ApiError("User creation failed", 500);
    }
    return res.status(201).json(

        new ApiResponse(200, createdUser, "User registered successfully")
    )
});

export { registerUser };
