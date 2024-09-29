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
        streetNumber: {
            type: String,
            required: true
        },
        streetName: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    },
    roomDiscription: {
        noofPeople: {     
            type: Number,
            required: true,
        },
        noOfRooms: {  // Number of beds/rooms
            type: Number,
            required: true,
        },
        noOfBathrooms: {  // Number of bathrooms
            type: Number,
            required: true,
        },
        fullyFurnished: {
            type: Boolean,
            required: true,
        },
    },
    dimensions: {  // Store length and breadth
        length: {
            type: Number,
            required: true,
        },
        breadth: {
            type: Number,
            required: true,
        }
    },
    area: {  // Calculated area in square feet
        type: Number
    },
    keyFeatures: {  // Array of key features
        type: [String],
        required: true,
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
    views: { // Number of views
        type: Number,
        default: 0,
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

// Before saving, calculate the area
postSchema.pre('save', function (next) {
    if (this.dimensions && this.dimensions.length && this.dimensions.breadth) {
        this.area = this.dimensions.length * this.dimensions.breadth;
    }
    next();
});

module.exports = mongoose.model('Post', postSchema);
