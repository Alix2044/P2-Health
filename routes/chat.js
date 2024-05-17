
const express = require('express');
const router = express.Router();

// Handle GET request to /chat/:roomId
router.get('/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  // Render the chat interface for the specified room ID
  const currentUserName = req.user.fullName;
  
  res.render('chat', { roomId, user:currentUserName});
});

module.exports = router;