/**
 * Require authenticated user. Redirects to home (login) if not logged in.
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/');
  }
  next();
};

/**
 * Require specific role. Renders 401 if user role does not match.
 * @param {string} role - 'superadmin' | 'user'
 */
const requireRole = (role) => (req, res, next) => {
  if (req.session.user.role !== role) {
    res.status(401);
    return res.render('401', { title: req.t ? req.t('errors.401') : 'Error 401' });
  }
  next();
};

module.exports = {
  requireAuth,
  requireRole,
};
