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
        userId,
    }

    const post = await Post.create(postData);
    res.status(StatusCodes.CREATED).json({ post });



};

const updatePost = async (req, res, next) => {
console.log('update post');
};

const deletePost = async (req, res, next) => {
    console.log('delete post');
};
const getAllPosts = async (req, res) => {
    console.log('get all posts');
};
const getPost = async (req, res) => {
    console.log('get post');
};







module.exports = { postRent,updatePost, deletePost , getAllPosts ,getPost  };