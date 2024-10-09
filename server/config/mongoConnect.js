const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/express-mongo";

mongoose.connect(MONGODB_URI);
