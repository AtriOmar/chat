const router = require("express").Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const authenticateJwt = require("../authenticateJwt.js");

// '/api/login' route

router.post("/", async function (req, res) {
  const { username, password } = req.body;

  try {
    // const result = await User2.findOne({
    //   where: {
    //     email,
    //   },
    // });
    const user = await User.findOne({
      username: { $regex: new RegExp("^" + username + "$", "i") },
    });

    console.log("from login", user);

    if (!user) {
      res.status(400).send("user not found");
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    console.log("-------------------- match --------------------");
    console.log(match);
    if (match) {
      if (!user.active) {
        res.status(400).send("suspended");
        return;
      }
      delete user.password;

      const token = jwt.sign({ sub: user.id }, process.env.MY_SECRET, { expiresIn: "30d" });

      console.log("-------------------- user, user._doc --------------------");
      console.log(user, user._doc);
      const response = {
        ...user.toJSON(),
        token,
      };

      console.log("-------------------- response --------------------");
      console.log(response);

      res.send(response);
      return;
    } else {
      res.status(400).send("incorrect password");
      return;
    }
  } catch (err) {
    console.log("-------------------- err --------------------");
    console.log(err);
    res.status(400).send(err);
    return;
  }
});

// '/api/login/status' route
router.get("/status", authenticateJwt /* passport.authenticate("jwt", { session: false }) */, (req, res) => {
  if (req.isAuthenticated()) {
    if (!req.user.active) {
      return res.send({ user: null });
    }

    return res.status(200).json({ user: req.user });
  }

  res.status(200).json({
    user: null,
  });
});

module.exports = router;
