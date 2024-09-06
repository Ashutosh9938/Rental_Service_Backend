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
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
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
