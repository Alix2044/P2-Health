const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../auth/isAuthenticated'); // Ensure this middleware is used
const Message = require('../models/Message');
const User = require('../models/User');

router.get('/:roomId', ensureAuthenticated, async (req, res) => {
  const roomId = req.params.roomId;
  const user = req.user; 

  
  const messages = await Message.find({ roomId }).populate('user', 'username').sort({ timestamp: 1 });

  res.render('chat', { roomId, userId: user._id, user: user.username, messages });
});

module.exports = router;
