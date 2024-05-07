const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const {ensureAuthenticated, redirectToDashboardIfAuthenticated} = require('../auth/isAuthenticated');
const passport = require('passport');

const User = require('../models/User'); 




router.get('/register',redirectToDashboardIfAuthenticated, (req, res) => {
    res.render('register');
});



router.get('/login',redirectToDashboardIfAuthenticated,(req, res) => {
    res.render('login');
});

/* Handling auth & form data */

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard', // Redirect to dashboard on successful login
        failureRedirect: '/auth/login', // Redirect back to login page on failed login
        failureFlash: true // Enable flash messages for failed login attempts
    })(req, res, next);
});

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
            errors: errors,
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
                // Render form with errors...
                res.render('register', {
                    errors: errors,
                    name,
                    email,
                    password,
                    password2
                });
            } else {
                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

                const newUser = new User({
                    fullName: name,
                    email,
                    password: hashedPassword // Save hashed password
                });

                // Save user to database
                await newUser.save();
                console.log('User registered:', newUser);
                res.redirect('/auth/login');

            }
        } catch (error) {
            console.error('Error during registration:', error);
           
           
        }
    }
});

router.get('/logout', (req, res) => {
    // Log the user out by clearing the session
    req.logout();
    
    // Display a success message using flash
    req.flash('success_msg', 'You have been successfully logged out.');

    // Redirect the user to the homepage
    res.redirect('/');
});

module.exports = router;
