const bcrypt = require("bcrypt");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User2 = require("../models/User2");
const jwt = require("jsonwebtoken");

module.exports = (passport) => {
  //  ======================== Passport Session Setup ============================
  // required for persistent login sessions passport needs ability to serialize and unserialize users out of session
  // used to serialize the user for the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // used to deserialize the user

  passport.deserializeUser(async (id, done) => {
    const user = (
      await User2.findByPk(id, {
        attributes: {
          exclude: "password",
        },
      })
    ).toJSON();
    done(null, user);
  });

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.MY_SECRET, // Replace with your actual secret key
      },
      async (payload, done) => {
        console.log("-------------------- payload --------------------");
        console.log(payload);
        try {
          const user = (await User2.findByPk(payload.sub)).toJSON();

          if (!user) {
            return done(null, false);
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};
