const mongoose = require('mongoose');
const Post = require('../models/post');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const cloudinary = require('cloudinary').v2;
const { BadRequestError, UnauthenticatedError } = require('../errors');

// Function to post a new rent
// Function to post a new rent
const postRent = async (req, res, next) => {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
        throw new UnauthenticatedError('Please authenticate first'); 
    }

    const media = req.files?.media;     

    if (!media) {  
        throw new BadRequestError('Please upload a file');
    }

    try {
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: 'auto', folder: 'job_media', tags: [userId, user.name] },
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );
            stream.end(media.data);
        });

        const { title, body, location, price, roomDiscription, length, breadth, keyFeatures } = req.body;

        // Validate required fields
        if (!title || !body || !location || !price || !roomDiscription || !length || !breadth || !keyFeatures) {
            throw new BadRequestError('Please provide all fields');
        }

        // Parse location, roomDiscription, and keyFeatures
        const locationParsed = JSON.parse(location);
        const roomDiscriptionParsed = JSON.parse(roomDiscription);
        const keyFeaturesParsed = JSON.parse(keyFeatures);

        // Calculate the area using the formula: area = length * breadth
        const area = length * breadth;
  
        const postData = {
            title,
            body,
            location: {
                streetNumber: locationParsed.streetNumber,
                streetName: locationParsed.streetName,
                city: locationParsed.city,
                state: locationParsed.state,
                postalCode: locationParsed.postalCode,
                country: locationParsed.country
            },
            price,
            roomDiscription: {
                noofPeople: roomDiscriptionParsed.noofPeople,
                noOfRooms: roomDiscriptionParsed.noOfRooms,
                noOfBathrooms: roomDiscriptionParsed.noOfBathrooms,
                fullyFurnished: roomDiscriptionParsed.fullyFurnished,
            },
            dimensions: { length, breadth, area },  // Store length, breadth, and calculated area
            keyFeatures: keyFeaturesParsed, // Store key features
            image: uploadResult.secure_url,
            jobPoster: {
                createdBy: userId,
                name: user.name,
            }
        };

        const post = await Post.create(postData);
        res.status(StatusCodes.CREATED).json({ post });
    } catch (error) {
        next(error);
    }
};


// Function to update a post
const updatePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            throw new BadRequestError('Post not found');
        }

        if (post.jobPoster.createdBy.toString() !== req.user.userId) {
            throw new UnauthenticatedError('You are not authorized to update this post');
        }

        const { title, body, location, price, roomDescription, area, keyFeatures } = req.body;

        const media = req.files?.media;
        let uploadResult;
        if (media) {
            uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: 'auto', folder: 'job_media', tags: [req.user.userId, post.jobPoster.name] },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                stream.end(media.data);
            });
            post.image = uploadResult.secure_url;
        }

        if (title) post.title = title;
        if (body) post.body = body;
        if (location) {
            const locationParsed = JSON.parse(location);
            post.location = {
                streetNumber: locationParsed.streetNumber,
                streetName: locationParsed.streetName,
                city: locationParsed.city,
                state: locationParsed.state,
                postalCode: locationParsed.postalCode,
                country: locationParsed.country
            };
        }
        if (price) post.price = price;
        if (roomDescription) {
            const roomDescParsed = JSON.parse(roomDescription);
            post.roomDiscription = {
                noofPeople: roomDescParsed.noofPeople,
                noOfRooms: roomDescParsed.noOfRooms,
                noOfBathrooms: roomDescParsed.noOfBathrooms,
                fullyFurnished: roomDescParsed.fullyFurnished,
            };
        }
        if (area) post.area = area; // Update the area field
        if (keyFeatures) post.keyFeatures = JSON.parse(keyFeatures); // Update key features

        await post.save();

        res.status(StatusCodes.OK).json({ post });
    } catch (error) {
        next(error);
    }
};

// Function to delete a post
const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            throw new BadRequestError('Post not found');
        }

        if (!post.jobPoster || post.jobPoster.createdBy.toString() !== req.user.userId) {
            throw new UnauthenticatedError('You are not authorized to delete this post');
        }

        await post.remove();

        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        next(error);
    }
};

// Function to get all posts
const getAllPosts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        // Get total count of posts
        const totalPosts = await Post.countDocuments();

        // Fetch posts with pagination, sorted by createdAt in descending order
        const posts = await Post.find({})
            .sort({ createdAt: -1 }) // Sort by createdAt, -1 for descending order
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        res.status(StatusCodes.OK).json({
            posts,
            totalPosts,
            postsPerPage: limitNumber,
        });
    } catch (error) {
        next(error);
    }
};

// Function to get a single post
const getPost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            throw new BadRequestError('Post not found');
        }

        // Increment the views count
        post.views += 1;
        await post.save();

        res.status(StatusCodes.OK).json({ post });
    } catch (error) {
        next(error);
    }
};

// Function to get the top 4 featured houses (most viewed houses)
const getFeaturedHouse = async (req, res, next) => {
    try {
        // Get the total count of posts
        const totalPostsCount = await Post.countDocuments();

        // Find the top 4 posts with the most views
        const featuredPosts = await Post.find().sort({ views: -1 }).limit(3).exec();

        if (!featuredPosts || featuredPosts.length === 0) {
            throw new BadRequestError('No featured houses found');
        }

        res.status(StatusCodes.OK).json({ 
            totalPosts: totalPostsCount,  // Return the total count of posts
            featuredPosts 
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { postRent, updatePost, deletePost, getAllPosts, getPost, getFeaturedHouse };
