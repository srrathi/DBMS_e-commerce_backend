const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mysqlConnection = require("./database/db");
const PORT = process.env.PORT || 5500;
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");


const options = {
  dotfiles: "ignore",
  etag: true,
  extensions: ["png", "jpg", "jpeg", "webp"],
  index: false,
  maxAge: "7d",
  redirect: false,
  setHeaders: (res, path, stat) => {
    res.set("x-timestamp", Date.now());
  },
};

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());
app.use(express.static("static", options));

const cart = require("./routes/cart");
const customer = require("./routes/customer");
const product = require("./routes/product");
const seller = require("./routes/seller");
const transc = require("./routes/transc");

app.use("/api/cart", cart);
app.use("/api/customer", customer);
app.use("/api/seller", seller);
app.use("/api/product", product);
app.use("/api/transc", transc);

dotenv.config();

mysqlConnection.connect((err) => {
  if (!err) console.log("MYSQL database connected successfully!");
  else console.log("Connection failed", err);
});

app.listen(PORT, () => {
  console.log(`Server running at Port ${PORT}`);
});
