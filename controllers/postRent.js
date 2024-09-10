const Post = require('../models/post');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const cloudinary = require('cloudinary').v2;

const { BadRequestError, UnauthenticatedError } = require('../errors');


const postRent = async (req, res, next) => {
    const userId =req.user.userId;
    const user= await User.findById(userId);
   if (!user) {
       throw new UnauthenticatedError('Please authenticate first');  
    }
    const media =req.files.media

    if(!media) {
        throw new BadRequestError('Please upload a file');
    }
    const uploadpromises = new Promise((resolve,reject)=>{
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: 'job_media', tags: [userId, user.name] },(error,result)=>{
                if(result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        )
        stream.end(media.data);
    })
    const uploadedMedia=  await uploadpromises;
    const { title, body, location, price } = req.body;
    if(fields = !title || !body || !location || !price) {
        throw new BadRequestError('Please provide all fields ' `${fields}`);
    }

    const postData={
        title,
        body,
        location,
        price,
        image: uploadedMedia.secure_url,
        jobPoster:{
        createdBy:req.user.userId,
        name:user.name,
        }
    }

    const post = await Post.create(postData);
    res.status(StatusCodes.CREATED).json({ post });
};

const updatePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        if (!post) {
          throw new BadRequestError('post not found');
        }
    
        if (post.jobPoster.createdBy.toString() !== req.user.userId) {
            console.log( post.jobPoster.createdBy);
            console.log(req.user.userId);
          throw new UnauthenticatedError('You are not authorized to update this post');
        }
    
        const { title, body, location, price  } = req.body;
    
        if (title) {
            post.title = title;
        }
        if (body) {
            post.body = body;
        }
        if (location) {
            post.location = location;
        }
        if (price) {
            post.price= price;
        }
    
        await post.save();
    
        res.status(StatusCodes.OK).json({ post});
      } catch (error) {
        next(error);
      };
};

const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        
        if (!post) {
            throw new BadRequestError('Post not found');
        }

        if (!post.jobPoster || !post.jobPoster.createdBy) {
            throw new BadRequestError('Post is missing required jobPoster information.');
        }

        if (post.jobPoster.createdBy.toString() !== req.user.userId) {
            console.log(post.jobPoster.createdBy);
            console.log(req.user.userId);
            throw new UnauthenticatedError('You are not authorized to delete this post');
        }

        await post.remove();

        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        next(error);
    }
};
const getAllPosts = async (req, res,next) => {
    try {
        const post = await Post.find({})
    
        res.status(StatusCodes.OK).json({ post});
      } catch (error) {
        next(error);
      }
    };

const getPost = async (req, res,next) => {
    try {
        const { id } = req.params;
    
        const post = await Post.findById(id);
    
        if (!post) {
          throw new BadRequestError('post not found');
        }
    
        res.status(StatusCodes.OK).json({ post });
      } catch (error) {
        next(error);
      }
    };







module.exports = { postRent,updatePost, deletePost , getAllPosts ,getPost  };