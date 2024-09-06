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
      type:String,
      required:true
    },
    jobPoster:{
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
},
{ timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
