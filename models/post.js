const mongoose = require('mongoose');


const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },

    location: {
        type: {
            type: String, 
            enum: ['Point'], 
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    roomDiscription: {
      noofPeople: {
        type: Number,
        required: true,
      },
      noOfRooms: {
        type: Number,
        required: true,
      },
      noOfBathrooms: {
        type: Number,
        required: true,
      },
      fullyFurnished: { // Typo corrected
        type: Boolean,
        required: true,
      },
    },
    jobPoster: {
      createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
      },
      name: {
        type: String,
        required: true,
      },
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    userVerified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }
}, 
{ timestamps: true }
);


postSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Post', postSchema);
