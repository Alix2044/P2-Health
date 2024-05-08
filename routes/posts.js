const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory where uploaded files will be stored
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName); // Unique filename for each uploaded file
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // file type to allow only images
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});


// Display all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('author');
    res.render('allPosts', { posts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving posts');
  }
});

router.get('/new', upload.single('image'),(req, res) => {
  res.render('newPost');
});

// Handle file upload and create a new post
router.post('/new', upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;

    let imagePath = req.file ? req.file.path : null;
  if (!req.user) {
      return res.status(401).send('Unauthorized');
    }

    const author = req.user._id; 



    


    const newPost = new Post({
      title,
      content,
      author,
    image: imagePath ? imagePath.replace(/\\/g, '/') : null // Replace backslashes with forward slashes

    });
console.log(newPost.image);
    await newPost.save();
    await User.findByIdAndUpdate(author, { $push: { posts: newPost._id } });

    res.redirect(`/posts`);
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
