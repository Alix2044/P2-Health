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
    dateTime:{
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('User',UserData);

