const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const passport = require('passport');

const User = require('../models/User');
const { ensureAuthenticated, redirectToDashboardIfAuthenticated } = require('../auth/isAuthenticated');

// Validation middleware for user registration
const validateRegistration = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('password2').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
];


router.get('/register', redirectToDashboardIfAuthenticated, (req, res) => {
    res.render('register', { messages: req.flash(), layout: false });
});


router.get('/login', redirectToDashboardIfAuthenticated, (req, res) => {
    res.render('login', { messages: req.flash(), layout: false });
});


router.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true
}));

router.post('/register', validateRegistration, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       errors.array().forEach(error => {
            req.flash('error', error.msg);
        });
      
        return res.redirect('/auth/register');
    }

    const { name, email, password } = req.body;
    

    try {
        const userFound = await User.findOne({ email });
        if (userFound) {
      req.flash('error', 'This email/user already exists...');
      req.flash('warning', 'Please try another email');
        return res.render('register', { ...req.body });

        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ fullName: name, email, password: hashedPassword });
        await newUser.save();
        console.log('User registered:', newUser);

        res.redirect('/auth/login');
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send('Error during registration');
    }
});

router.get('/logout', ensureAuthenticated, (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error logging out:', err);
            res.status(500).send('Error logging out');
        } else {
            res.redirect('/');
        }
    });
});

module.exports = router;
