require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Token = require('../models/Token');
const { createJWT } = require('../utils');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const client = new OAuth2Client(process.env.ClientId);
const {
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
  sendResetPasswordEmail,
  createHash,
} = require('../utils');  
const crypto = require('crypto');

const register = async (req, res) => {
  const { email, name, lastName ,password , comformationPassword, nationality, phoneNumber } = req.body;

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError('Email already exists');
  }
  if (password !== comformationPassword) {
    throw new CustomError.BadRequestError('Passwords do not match');
  }
  if (!email || !name || !lastName || !password || !comformationPassword || !nationality || !phoneNumber) {
    throw new CustomError.BadRequestError('Please provide all values');
  }

  const user = await User.create({
    name,
    email,
    password,
    comformationPassword,
    nationality,
    phoneNumber,
    lastName
    // role,
    // verificationToken,
  });

  // const origin = process.env.HOST_URL || 'http://localhost:3000';

  // await sendVerificationEmail({
  //   name: user.name,
  //   email: user.email,
  //   verificationToken: user.verificationToken,
  //   origin,
  // });
  
  const tokenUser = createTokenUser(user);

  let refreshToken = '';

  const existingToken = await Token.findOne({ user: user._id });

  if (existingToken) {
    const { isValid } = existingToken;
    if (!isValid) {
      throw new CustomError.UnauthenticatedError('Invalid Credentials');
    }
    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(StatusCodes.OK).json({ user: tokenUser });
    return;
  }

  refreshToken = crypto.randomBytes(40).toString('hex');
  const userAgent = req.headers['user-agent'];
  const ip = req.ip;
  const userToken = { refreshToken, ip, userAgent, user: user._id };

  await Token.create(userToken);

  attachCookiesToResponse({ res, user: tokenUser, refreshToken });

  res.status(StatusCodes.OK).json({ user: tokenUser ,tokenUser});
};

const verifyEmail = async (req, res) => {
  //   const { verificationToken, email } = req.body;

  //   if (!verificationToken || !email) {
  //     throw new CustomError.BadRequestError('Please provide both verification token and email');
  //   }

  //   try {
  //     const user = await User.findOne({ email });

  //     if (!user) {
  //       throw new CustomError.UnauthenticatedError('Verification Failed');
  //     }

  //     if (user.verificationToken !== verificationToken) {
  //       throw new CustomError.UnauthenticatedError('Verification Failed');
  //     }

  //     if (user.isVerified) {
  //       throw new CustomError.BadRequestError('Email already verified');
  //     }

  //     user.isVerified = true;
  //     user.verified = Date.now();
  //     user.verificationToken = '';

  //     await user.save();

  //     res.status(StatusCodes.OK).json({ msg: 'Email Verified' });
  //   } catch (error) {
  //     console.error('Email verification error:', error);
  //     if (error instanceof CustomError.CustomAPIError) {
  //       res.status(error.statusCode).json({ msg: error.message });
  //     } else {
  //       res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'An error occurred during verification' });
  //     }
  //   }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError('Please provide email and password');
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.UnauthenticatedError('user not found with this email');
  }

  // if (!user) {
  //   throw new CustomError.UnauthenticatedError('Invalid Credentials');
  // }
  // const isPasswordCorrect = await user.comparePassword(password);

  // if (!isPasswordCorrect) {
  //   throw new CustomError.UnauthenticatedError('Invalid Credentials');
  // }
  // if (!user.isVerified) {
  //   throw new CustomError.UnauthenticatedError('Please verify your email');
  // }
  
  const tokenUser = createTokenUser(user);

  let refreshToken = '';

  const existingToken = await Token.findOne({ user: user._id });

  if (existingToken) {
    const { isValid } = existingToken;
    if (!isValid) {
      throw new CustomError.UnauthenticatedError('Invalid Credentials');
    }
    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(StatusCodes.OK).json({ user: tokenUser });
    return;
  }

  refreshToken = crypto.randomBytes(40).toString('hex');
  const userAgent = req.headers['user-agent'];
  const ip = req.ip;
  const userToken = { refreshToken, ip, userAgent, user: user._id };

  await Token.create(userToken);

  attachCookiesToResponse({ res, user: tokenUser, refreshToken });

  res.status(StatusCodes.OK).json({ user: tokenUser,tokenUser});
};

const logout = async (req, res) => {
  await Token.findOneAndDelete({ user: req.user.userId });

  res.cookie('accessToken', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie('refreshToken', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new CustomError.BadRequestError('Please provide valid email');
  }

  const user = await User.findOne({ email });

  if (user) {
    const passwordToken = crypto.randomBytes(70).toString('hex');
    const origin = process.env.HOST_URL || 'http://localhost:3000';
    await sendResetPasswordEmail({
      name: user.name,
      email: user.email,
      token: passwordToken,
      origin,
    });

    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    user.passwordToken = createHash(passwordToken);
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;
    await user.save();
  }

  res.status(StatusCodes.OK).json({ msg: 'Please check your email for reset password link' });
};

const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password) {
    throw new CustomError.BadRequestError('Please provide all values');
  }
  const user = await User.findOne({ email });

  if (user) {
    const currentDate = new Date();

    if (
      user.passwordToken === createHash(token) &&
      user.passwordTokenExpirationDate > currentDate
    ) {
      user.password = password;
      user.passwordToken = null;
      user.passwordTokenExpirationDate = null;
      await user.save();
    }
  }

  res.send('reset password');
};

const updateUser = async (req, res) => {
  const { email, name, lastName, location, lookingFor } = req.body;

  if (!email || !name || !lastName || !location || !lookingFor) {
    throw new CustomError.BadRequestError('Please provide all values');
  }

  if (!['RoomPatner', 'appartment', 'both'].includes(lookingFor)) {
    throw new CustomError.BadRequestError('Please provide a valid lookingFor value');
  }

  const user = await User.findOne({ _id: req.user.userId });

  user.email = email;
  user.name = name;
  user.lastName = lastName;
  user.location = location;
  user.lookingFor = lookingFor;

  await user.save();
  
  const token = user.createJWT();

  res.status(StatusCodes.OK).json({
    user: {
      email: user.email,
      lastName: user.lastName,
      location: user.location,
      name: user.name,
      lookingFor: user.lookingFor,
      token,
    },
  });
};

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.ClientId,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name,
        googleId
      });
    }

    const tokenUser = createTokenUser(user);

    let refreshToken = '';
    const existingToken = await Token.findOne({ user: user._id });

    if (existingToken) {
      const { isValid } = existingToken;
      if (!isValid) {
        throw new CustomError.UnauthenticatedError('Invalid Credentials');
      }
      refreshToken = existingToken.refreshToken;
      attachCookiesToResponse({ res, user: tokenUser, refreshToken });
      res.status(StatusCodes.OK).json({ user: tokenUser });
      return;
    }

    refreshToken = crypto.randomBytes(40).toString('hex');
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const userToken = { refreshToken, ip, userAgent, user: user._id };

    await Token.create(userToken);
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });

    res.status(StatusCodes.OK).json({ user: tokenUser });
  } catch (error) {
    console.error('Error in Google login:', error);
    res.status(500).json({ error: 'Google login failed' });
  }
};

const getUsersLookingForRoomPartner = async (req, res) => {
  try {
    // We are hardcoding 'RoomPatner' since we only want to get users looking for room partners
    const lookingFor = 'RoomPatner';

    // Find users who are looking for a Room Partner
    const users = await User.find({ lookingFor });

    // Send the response with the list of users
    res.status(StatusCodes.OK).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'An error occurred while fetching users' });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      throw new CustomError.NotFoundError(`No user found with id: ${userId}`);
    }
    user.profileViews = (user.profileViews || 0) + 1;
    await user.save();

    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    console.error('Error fetching single user:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'An error occurred while fetching the user' });
  }
};
const getTopViewedProfiles = async (req, res) => {
  try {

    const topUsers = await User.find({})
      .sort({ profileViews: -1 })
      .limit(3); 

    res.status(StatusCodes.OK).json({ topUsers });
  } catch (error) {
    console.error('Error fetching top viewed profiles:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'An error occurred while fetching top viewed profiles' });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(StatusCodes.OK).json({ users });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'An error occurred while fetching users' });
  }
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateUser,
  googleLogin,
  getUsersLookingForRoomPartner,
  getSingleUser, 
  getTopViewedProfiles,
  getAllUsers
};
