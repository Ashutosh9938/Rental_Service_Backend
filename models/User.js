const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  profilePicture: {
    type: String,
    default: function() {
      const urls = [
        "https://res.cloudinary.com/debjnxbys/image/upload/v1719296060/profile_Picture/lmwikhknerjjeac1gu3b.avif",
        "https://res.cloudinary.com/debjnxbys/image/upload/v1719296273/profile_Picture/xfehfyieow7ichyucqve.jpg",
        "https://res.cloudinary.com/debjnxbys/image/upload/v1719296270/profile_Picture/r2sxxekwmg2dld5czj32.jpg",
        "https://res.cloudinary.com/debjnxbys/image/upload/v1719296252/profile_Picture/auopkluaqi3tzrnl6fyd.avif",
        "https://res.cloudinary.com/debjnxbys/image/upload/v1719296243/profile_Picture/w2a5evfkprpif82verhs.avif",
        "https://res.cloudinary.com/debjnxbys/image/upload/v1719296216/profile_Picture/zqelbqsjagswlsgiopck.jpg"
      ];
      return urls[Math.floor(Math.random() * urls.length)];
    }
  },
  name: {
    type: String,
    required: [true, 'Please provide name'],
    minlength: 3,
  },
  lastName: {
    type: String,
    required: [true, 'Last name required'],
    minlength: 3,
  },
  nationality: {
    type: String,
    required: [true, 'Please provide nationality'],
    minlength: 3,
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide phone number'],
    unique: true,
    minlength: 10,
    maxlength: 15,
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please provide email'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email',
    },
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
    validate: {
      validator: function (value) {
        return /[A-Z]/.test(value) && /\d/.test(value) && /[!@#$%^&*(),.?":{}|<>]/.test(value);
      },
      message: 'Password must contain at least one uppercase letter, one number, and one special character',
    },
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  lookingFor:{
    type: String,
    enum:['RoomPatner', 'appartment', 'both'],
  },
  verificationToken: String,
  isVerified: {
    type: Boolean,
    default: false,
  },
  verified: Date,
  passwordToken: {
    type: String,
  },
  passwordTokenExpirationDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  personalDocumentsubmitted: {
    type: Boolean,
    default: false,
  },
  personalDocumentVerified: {
    type: Boolean,
    default: false,
  },
  profileViews: {
    type: Number,
    default: 0,
  },
  // googleId: {
  //   type: String,
  //   required: true,
  // },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
