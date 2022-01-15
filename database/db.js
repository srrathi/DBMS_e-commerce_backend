const mysql = require("mysql");
const dotenv = require("dotenv");
dotenv.config();

const mysqlConnection = mysql.createPool({
  connectionLimit: 100,
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  debug: false,
});

// const mysqlConnection = mysql.createConnection({
//   host: process.env.host,
//   user: process.env.user,
//   password: process.env.password,
//   database: process.env.database,
//   multipleStatements: true,
// });

module.exports = mysqlConnection;
