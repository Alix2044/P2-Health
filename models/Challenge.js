const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  completedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
});

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;
