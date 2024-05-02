// posts.js

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Display all posts
router.get('/', async (req, res) => {
  try {
    // Fetch all posts from the database
    const posts = await Post.find().populate('author');

    // Render the view template and pass the posts data
    res.render('all_posts', { posts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving posts');
  }
});

router.get('/new', (req, res) => {
  res.render('new_post');
});

router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // Ensure req.user is defined before accessing req.user._id
    if (!req.user) {
      return res.status(401).send('Unauthorized');
    }

    const author = req.user._id; // Assign the author field here

    const newPost = new Post({
      title,
      content,
      author
    });

    await newPost.save();
    res.redirect(`/posts/${newPost._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating post');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author');
    if (!post) {
      return res.status(404).send('Post not found');
    }
    res.render('show_post', { post });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving post');
  }
});

module.exports = router;
