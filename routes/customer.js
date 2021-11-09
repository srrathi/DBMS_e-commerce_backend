const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mysqlConnection = require("../database/db");
const { createTokens, validateToken } = require("../utils/JWT");
const dotenv = require("dotenv");
dotenv.config();

const { saltRounds } = require("../utils/constants.js");

// CUSTOMER REGISTER API
router.post("/customer-register", (req, res) => {
  const {
    customerName,
    customerPassword,
    customerEmail,
    customerEditDate,
    customerBankName,
    customerAccountNumber,
    customerMobileNumber,
    customerAddress,
  } = req.body;

  if (
    customerName !== "" &&
    customerEmail !== "" &&
    customerPassword !== "" &&
    customerEditDate !== ""
  ) {
    mysqlConnection.query(
      "SELECT customer_email FROM customer_table WHERE customer_email = ?",
      [customerEmail],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        if (result.length) {
          return res.status(400).json({
            success: false,
            message: "Email already registered please try Signing In",
          });
        } else {
          bcrypt.hash(customerPassword, saltRounds, function (err, hash) {
            // Store hash in your password DB.
            const hashedPassword = hash;
            const query = `INSERT INTO customer_table (
                customer_name, 
                customer_email, 
                customer_pass, 
                customer_reg_date, 
                customer_edit_date, 
                customer_bank_name, 
                customer_account_number, 
                customer_mob_no, 
                customer_address) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;
            mysqlConnection.query(
              query,
              [
                customerName,
                customerEmail,
                hashedPassword,
                new Date(),
                new Date(),
                customerBankName,
                customerAccountNumber,
                customerMobileNumber,
                customerAddress,
              ],
              (err, result) => {
                if (err) {
                  console.log(err);
                  res.send(err);
                } else {
                  console.log(result);
                  res.json({
                    success: true,
                    data: result,
                  });
                }
              }
            );
          });
        }
      }
    );
  } else {
    res.status(400).json({
      success: false,
      error: "Mandatory fields are not filled",
    });
  }
});

// CUSTOMER LOGIN API
router.post("/customer-login", async (req, res) => {
  const { customerEmail, customerPassword } = req.body;
  await mysqlConnection.query(
    `SELECT 
    customer_id, 
    customer_email, 
    customer_name, 
    customer_reg_date, 
    customer_edit_date,
    customer_pass,
    customer_bank_name,
    customer_account_number,
    customer_mob_no,
    customer_address 
    FROM customer_table WHERE customer_email = ?;`,
    [customerEmail],
    (error, result) => {
      if (error) {
        console.log(error);
      }
      if (!result.length) {
        return res.status(400).json({
          success: false,
          message: "User doesn't exist, Please make an Account",
        });
      } else {
        const hashedPassword = result[0].customer_pass;
        bcrypt.compare(customerPassword, hashedPassword).then((match) => {
          if (!match) {
            res.status(400).json({
              status: false,
              message: "Email or Password Incorrect",
            });
          } else {
            const tokenObject = {
              email: result[0].customer_email,
              pass: result[0].customer_pass,
              id: result[0].customer_id,
              role: "customer",
            };
            const accessToken = createTokens(tokenObject);
            console.log(tokenObject, accessToken);

            res.cookie(process.env.cookieName, accessToken, {
              maxAge: 60 * 60 * 24 * 30 * 1000,
              httpOnly: true,
            });
            const customerData = result[0];
            delete customerData["customer_pass"];
            res.json({
              success: true,
              data: { accessToken: accessToken, customerData: customerData },
            });
          }
        });
      }
    }
  );
});

router.get("/profile", validateToken, async (req, res) => {
  res.json({ sucess: true, message: "Welcome to profile" });
});

router.get("/products-list", async (req, res) => {
  const query = `SELECT 
	  product_table.product_id, 
    product_table.product_category, 
    product_table.product_name, 
    product_table.product_about, 
    product_table.product_pic, 
    product_table.product_price, 
    product_table.product_rating_count,
    product_table.product_best_rating,
    product_table.product_max_price,
    product_table.product_seller_id,
    product_table.product_count_stock,
    product_table.product_reg_date,
    product_table.product_update_date,
    seller_table.seller_firm_name,
    seller_table.seller_name,
    seller_table.seller_firm_info
    FROM product_table JOIN seller_table 
    ON product_table.product_seller_id = seller_table.seller_id;`;
  mysqlConnection.query(query, async (error, result, fields) => {
    // console.log(result);

    if (error) {
      console.log(error);
      res.status(400).json({
        success: false,
        message: error,
      });
    } else if (result && result.length) {
      res.status(200).json({
        success: true,
        data: result,
      });
    }
  });
});

// CUSTOMER UPDATE API
router.patch("/customer-update", async (req, res) => {
  const {
    customerId,
    customerName,
    customerPassword,
    customerEmail,
    customerBankName,
    customerAccountNumber,
    customerMobileNumber,
    customerAddress,
  } = req.body;
  if (customerId && customerEmail !== "" && customerName !== "") {
    await mysqlConnection.query(
      "SELECT customer_email, customer_id, customer_pass FROM customer_table WHERE customer_email = ? AND customer_id = ?;",
      [customerEmail, customerId],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        if (!result.length) {
          return res.status(400).json({
            success: false,
            message: "Invalid Password, Please try again",
          });
        } else {
          const hashedPassword = result[0].customer_pass;
          bcrypt.compare(customerPassword, hashedPassword).then((match) => {
            if (!match) {
              res.status(400).json({
                status: false,
                message: "Email or Password Incorrect",
              });
            } else {
              const query = `UPDATE customer_table SET 
                    customer_name = ?, 
                    customer_edit_date = ?, 
                    customer_bank_name = ?, 
                    customer_account_number = ?, 
                    customer_mob_no = ?, 
                    customer_address = ?
                  WHERE customer_id = ? AND customer_email = ?;`;
              mysqlConnection.query(
                query,
                [
                  customerName,
                  new Date(),
                  customerBankName,
                  customerAccountNumber,
                  customerMobileNumber,
                  customerAddress,
                  customerId,
                  customerEmail,
                ],
                (error, result) => {
                  if (error) {
                    console.log(error);
                    return res.status(400).json({
                      success: false,
                      error: error,
                    });
                  } else {
                    res.json({
                      success: true,
                      data: result,
                    });
                  }
                }
              );
            }
          });
        }
      }
    );
  } else {
    res.status(400).json({
      success: false,
      message: "Mandatory fields are empty",
    });
  }
});

module.exports = router;
