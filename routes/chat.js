
const express = require('express');
const router = express.Router();

// Handle GET request to /chat/:roomId
router.get('/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  // Render the chat interface for the specified room ID
  res.render('chat', { roomId });
});

module.exports = router;