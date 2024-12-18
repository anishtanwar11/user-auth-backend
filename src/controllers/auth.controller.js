import dotenv from "dotenv";
dotenv.config();
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  emailVerificationMailgenContent,
  sendMail,
  forgotPasswordMailgenContent,
} from "../utils/mail.js";
import {
  destroyFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Somthing went wrong while generating access and refresh token!"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  if ([fullName, email, password].some((feild) => feild?.trim() === "")) {
    throw new ApiError(400, "All fields required!");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with email already exist!", []);
  }

  const user = await User.create({
    fullName,
    email,
    password,
    isEmailVerified: false,
    avatar: "",
    avatarPublicId: "",
  });

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendMail({
    email: user?.email,
    subject: "Please verify you email",
    mailgenContent: emailVerificationMailgenContent(
      user.fullName,
      `${req.protocol}://${req.get(
        "host"
      )}/api/v1/user/verift-email/${unHashedToken}`
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -emailVerificationToken -emailVerificationExpiry"
  );
  if (!createdUser) {
    throw new ApiError(500, "Somthing went wrong while registring user!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        createdUser,
        "Users registered successfully and verification email has been sent on your email."
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((feild) => feild?.trim() === "")) {
    throw new ApiError(400, "email and password is required!");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User with email not exist!");
  }

  if (user.isEmailVerified === false) {
    throw new ApiError(404, "Please verify your email for login!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(404, "Invalid credentials!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  console.log("accessToken", accessToken);
  console.log("refreshToken", refreshToken);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None", // enable when deployee website
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    })
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully!"
      )
    );
});

const refreshAccessToken =  asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // check if incoming refresh token is same as the refresh token attached in the user document
    // This shows that the refresh token is used or not
    // Once it is used, we are replacing it with new refresh token below
    if(incomingRefreshToken !== user?.refreshToken){
      // If token is valid but is used already
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();
    
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None", // Enable when deployed
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    }
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("accessToken", newRefreshToken, {
        ...options,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      })
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken }, 
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None", // Needed for cross-origin requests
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out!"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing");
  }

  // generate a hash from the token that we are receiving
  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // While registering the user, same time when we are sending the verification mail
  // we have saved a hashed value of the original email verification token in the db
  // We will try to find user with the hashed token generated by received token
  // If we find the user another check is if token expiry of that token is greater than current time if not that means it is expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }

  // If we found the user that means the token is valid
  // Now we can remove the associated email token and expiry date as we no  longer need them
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  // Turn the email verified flag to `true`
  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, { isEmailVerified: true }, "Email is verified"));
});

const avatarUpdate = asyncHandler(async (req, res) => {
  const avatarFile = req.files?.avatar[0];

  console.log("Avatar-file-", avatarFile);

  if (!avatarFile) {
    throw new ApiError(404, "Avatar local file path is required");
  }

  const avatar = await uploadOnCloudinary(avatarFile.buffer);

  console.log("Avatar upload response", avatar);

  if (!avatar || !avatar.url || !avatar.public_id) {
    throw new ApiError(409, "Avatar cloudinary file URL is required");
  }
  const user = await User.findById(req.user._id);

  console.log("user-", user);

  if (!user) {
    throw new ApiError(400, "User not found!");
  }

  if (user.avatarPublicId) {
    await destroyFromCloudinary(user.avatarPublicId);
    console.log();
  }

  user.avatar = avatar.url;
  user.avatarPublicId = avatar.public_id;
  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.user._id).select(
    "-password -refreshToken -avatarPublicId"
  );

  console.log("Updated User-", updatedUser);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully!"));
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if(!email){
    throw new ApiError(400, "Registered email is required!.");
  }
  
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User with email not exist.");
  }

  // Generate temporary token
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendMail({
    email: user?.email,
    subject: "Password reset request",
    mailgenContent: forgotPasswordMailgenContent(
      user.fullName,
      // ! NOTE: Following link should be the link of the frontend page responsible to request password reset
      // ! Frontend will send the below token with the new password in the request body to the backend reset password endpoint
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset mail has been sent on your mail id"
      )
    );
});

const resetForgottenPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  if(!newPassword){
    throw new ApiError(400, "Password is required");
  }

  console.log("resetToken-",resetToken, "newPassword-",newPassword )

  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

    console.log("hashed Token-",hashedToken)
  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or expired");
  }

  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  avatarUpdate,
  forgotPasswordRequest,
  resetForgottenPassword,
  refreshAccessToken,
};
