const passport = require("passport");

module.exports = authenticateJwt = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (user) {
      // If a valid user is found in the token, authenticate and continue
      req.logIn(user, { session: false }, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        return next();
      });
    } else {
      // If no user is found in the token, pass null user and continue
      req.user = null;
      return next();
    }
  })(req, res, next);
};
