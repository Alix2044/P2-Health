const mongoose = require('mongoose');

const UserData = new mongoose.Schema({
    fullName:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    bmrCompleted: { 
        type: Boolean, 
        default: false },
    questionnaireCompleted: { 
        type: Boolean, 
        default: false },
    dateTime:{
        type: Date,
        default: Date.now
    },
     points: {
         type: Number, default: 0 
        },
    
    communityPoints:{
         type: Number, default: 0 
    },
    interestedPosts: 
    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' 

    }
    ]

});

module.exports = mongoose.model('User',UserData);

