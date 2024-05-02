const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcrypt = require('bcrypt');

module.exports = (passport) => {
    passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
        // Find a user in the database based on email
        User.findOne({ email: email }, (err, user) => {
            if (err) return done(err);
            // no user is found with the email
            if (!user) return done(null, false, { message: 'No user found with this email address' });

            // Compare password with hashed in DB
            bcrypt.compare(password, user.password, (err, result) => {
                if (err) return done(err);
                // User is not found in DB
                if (!result) return done(null, false, { message: 'Incorrect password' });
                // passwords match, return the user successfully. 
                return done(null, user);
            });
        });
    }));

    // Serialize user object to session
    passport.serializeUser((user, done) => {
        // Serialize user by storing only the user id in the session
        done(null, user.id);
    });

    // Deserialize user object from session
    passport.deserializeUser((id, done) => {
        // Find user by id in the DB
        User.findById(id, (error, user) => {
            // Pass errors, if any, and user completion made successfully
            done(error, user);
        });
    });
};
