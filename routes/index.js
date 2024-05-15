const express = require('express');
const { ensureAuthenticated, redirectToDashboardIfAuthenticated } = require('../auth/isAuthenticated');
const User = require('../models/User'); // Import the User model

const router = express.Router();

// Render the dashboard view when user navigates to /dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try {
        // Fetch users from the database and sort them by points in descending order
        
        const users = await User.find().sort({ points: -1 });
        // Render the dashboard view and pass the sorted users as data
         const currentUser = req.user; 
          let userPoints = 0;
           let userComPoints = 0;
    if (currentUser) {
      const user = await User.findById(currentUser._id);
      userPoints = user.points;
      userComPoints = user.communityPoints;
    }
        res.render('dashboard', { users,userPoints, userComPoints});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving users');
    }
});

router.get('/', redirectToDashboardIfAuthenticated, (req, res) => {
    res.render('index');
});

module.exports = router;
