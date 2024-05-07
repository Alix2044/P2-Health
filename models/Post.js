const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    image: String, // Field to store the image file path or URL
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to User model for author information
    },
    isPinned: Boolean,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
