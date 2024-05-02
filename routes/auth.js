const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const passport = require('passport');

const User = require('../models/User');
const { ensureAuthenticated, redirectToDashboardIfAuthenticated } = require('../auth/isAuthenticated');

router.get('/register', redirectToDashboardIfAuthenticated, (req, res) => {
    res.render('register');
});

router.get('/login', redirectToDashboardIfAuthenticated, (req, res) => {
    res.render('login');
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true
}));

router.post('/register', async (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            password,
            password2
        });
    } else {
        try {
            const userFound = await User.findOne({ email: email });
            if (userFound) {
                errors.push({ msg: 'This email/user exists' });
                res.render('register', {
                    errors,
                    name,
                    email,
                    password,
                    password2
                });
            } else {
                const hashedPassword = await bcrypt.hash(password, 10);
                const newUser = new User({
                    fullName: name,
                    email,
                    password: hashedPassword
                });
                await newUser.save();
                console.log('User registered:', newUser);
               // req.flash('success_msg', 'You are now registered and can log in');
                res.redirect('/auth/login');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            res.status(500).send('Error during registration');
        }
    }
});

router.get('/logout', ensureAuthenticated, (req, res) => {
    req.logout();
    req.flash('success_msg', 'You have been successfully logged out');
    res.redirect('/');
});

module.exports = router;
