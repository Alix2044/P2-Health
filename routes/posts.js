const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const { ensureAuthenticated } = require('../auth/isAuthenticated');

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
			cb(new Error('Only images with correct file type are allowed'));
		}
	}
});

router.get('/', ensureAuthenticated, async (req, res) => {
	try {
		const posts = await Post.find().populate('author');
		const user = req.user;
		res.render('allPosts', { posts, user });
	} catch (error) {
		console.error(error);
		res.status(500).send('Error retrieving posts');
	}
});
router.post('/interested/:postId', ensureAuthenticated, async (req, res) => {
	try {
		const userId = req.user._id;
		const postId = req.params.postId;
		const user = await User.findById(userId);

		const isInterested = user.interestedPosts.includes(postId);

		if (isInterested) {
			// Remove the post from the interested posts
			await User.findByIdAndUpdate(userId, { $pull: { interestedPosts: postId } });
			await User.findByIdAndUpdate(userId, { $inc: { communityPoints: -1 } });
		} else {
			// Add the post to the interested posts
			await User.findByIdAndUpdate(userId, { $push: { interestedPosts: postId } });
			await User.findByIdAndUpdate(userId, { $inc: { communityPoints: 1 } });
		}

		res.redirect('back');
	} catch (error) {
		console.error(error);
		res.status(500).send('Error while toggling interest button. Please return back');
	}
});

router.get('/new', upload.single('image'), (req, res) => {
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

module.exports = router;
