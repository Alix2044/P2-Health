const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const { ensureAuthenticated } = require('../auth/isAuthenticated');

router.get('/', ensureAuthenticated, async (req, res) => {
	try {
		// Retrieve challenges from the DB
		const challenges = await Challenge.find({});

		const currentUser = req.user;
		let userPoints = 0;
		if (currentUser) {
			const user = await User.findById(currentUser._id);
			userPoints = user.points;
		}

		res.render('challenges', { challenges, userPoints, currentUser });
	} catch (error) {
		console.error(error);
		res.status(500).send('Error retrieving challenges');
	}
});

// Route for handling completion of a challenge
router.post('/completed/:challengeId', ensureAuthenticated, async (req, res) => {
	const challengeId = req.params.challengeId;
	const userId = req.user._id;

	try {
		await Challenge.findByIdAndUpdate(challengeId, { $addToSet: { completedBy: userId } });
		await User.findByIdAndUpdate(userId, { $inc: { points: 1 } });
		res.redirect('/challenges');
	} catch (error) {
		console.error(error);
		res.status(500).send('Error completing challenge');
	}
});

module.exports = router;
