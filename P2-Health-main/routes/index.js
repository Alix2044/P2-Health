const express = require('express');
const  {ensureAuthenticated,redirectToDashboardIfAuthenticated }= require('../auth/isAuthenticated')
const Post = require('../models/Post');





const router = express.Router();

router.get('/dashboard',ensureAuthenticated,(req, res) => {
    // Render the dashboard view when user navigates to /dashboard
    res.render('dashboard');
});


router.get('/', redirectToDashboardIfAuthenticated,(req,res)=>{
    res.render('index')
})

router.post('/posts', async (req, res) => {
    const { title, content } = req.body;
    const author = req.body.user ? req.user.fullName : 'Anonymous';

    try {
        const newPost = new Post({ title, content, author });
        await newPost.save(); // Save the new post asynchronously
        res.redirect('/posts');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating blog post');
    }
});


module.exports=router;