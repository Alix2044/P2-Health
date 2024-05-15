
const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const { ensureAuthenticated } = require('../auth/isAuthenticated');



router.get('/',ensureAuthenticated, async (req, res) => {
  try {
    // Retrieve challenges from the database
    const challenges = await Challenge.find({});
    // Get the current user's points
    const currentUser = req.user; 
    let userPoints = 0;
    if (currentUser) {
      const user = await User.findById(currentUser._id);
      userPoints = user.points;
    }
    // Render challenges page and pass challenges data and user points
    res.render('challenges', { challenges, userPoints, currentUser  });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving challenges');
  }
});

// Route for handling completion of a challenge
router.post('/complete/:challengeId',ensureAuthenticated, async (req, res) => {
  const challengeId = req.params.challengeId;
  const userId = req.user._id; 

  try {
    // Update challenge document to mark it as completed by the user
    await Challenge.findByIdAndUpdate(challengeId, { $addToSet: { completedBy: userId } });
    // Increment user's points
    await User.findByIdAndUpdate(userId, { $inc: { points: 1 } });
    res.redirect('/challenges');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error completing challenge');
  }
});

module.exports = router;
