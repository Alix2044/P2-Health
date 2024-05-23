const authMiddleware = {
	ensureAuthenticated: function(req, res, next) {
		if (!req.isAuthenticated()) {
			return res.redirect('/auth/login');
		}
		// If authenticated, proceed to the next middleware
		return next();
	},
	redirectToDashboardIfAuthenticated: function(req, res, next) {
		if (req.isAuthenticated()) {
			return res.redirect('/dashboard');
		}
		// If not authenticated, proceed to the next middleware
		return next();
	}
};

module.exports = authMiddleware;
