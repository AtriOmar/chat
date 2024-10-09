const { Sequelize } = require("sequelize");

const host = process.env.DB_HOST,
  port = process.env.DB_PORT,
  user = process.env.DB_USER,
  password = process.env.DB_PW,
  database = process.env.DB_NAME;

var sequelize;

try {
  sequelize = new Sequelize(database, user, password, {
    host,
    dialect: "mysql",
    logging: false,
  });
} catch (err) {
  // console.log("----------------------------------");
  // console.log("----------------------------------");
  // console.log("---------connection error---------");
  // console.log("----------------------------------");
  // console.log("----------------------------------");
  console.log(err);
}

module.exports = sequelize;
