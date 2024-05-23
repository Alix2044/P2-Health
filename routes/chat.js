const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../auth/isAuthenticated'); // Ensure this middleware is used
const Message = require('../models/Message');
const User = require('../models/User');

router.get('/:roomId', ensureAuthenticated, async (req, res) => {
	const roomId = req.params.roomId;
	const user = req.user;

	const messages = await Message.find({ roomId }).populate('user', 'fullName').sort({ timestamp: 1 }); // Populate the 'fullName' field from the User model

	res.render('chat', { roomId, userId: user._id, user: user.fullName, messages }); //provides current userId, their fullName
});

module.exports = router;
