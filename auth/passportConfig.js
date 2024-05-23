const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcrypt = require('bcrypt');

module.exports = (passport) => {
	passport.use(
		new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
			try {
				const user = await User.findOne({ email: email });
				if (!user) {
					return done(null, false, { message: 'There is no user with email' });
				}
				const match = await bcrypt.compare(password, user.password);
				if (!match) {
					return done(null, false, { message: 'Incorrect password. Please try again.' });
				}
				return done(null, user);
			} catch (error) {
				return done(error);
			}
		})
	);

	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	passport.deserializeUser(async (id, done) => {
		try {
			const user = await User.findById(id);
			done(null, user);
		} catch (error) {
			done(error);
		}
	});
};
