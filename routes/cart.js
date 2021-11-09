const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { validateToken } = require("../utils/JWT");
const mysqlConnection = require("../database/db");

router.get("/cart-products/:cartCustomerId", (req, res) => {
  const { cartCustomerId } = req.params;
  if (cartCustomerId) {
    mysqlConnection.query(
      "SELECT * FROM cart_table WHERE cart_customer_id = ?;",
      [cartCustomerId],
      (error, result) => {
        if (error) {
          console.log(error);
          res.status(400).json({
            success: false,
            message: error,
          });
        } else if (result) {
          console.log(result);
          res.status(200).json({
            success: true,
            data: result,
          });
        }
      }
    );
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid Customer",
    });
  }
});

router.post("/cart-add", (req, res) => {
  const {
    cartProductId,
    cartProductPrice,
    cartModified,
    cartProductCount,
    cartPurchased,
    cartProductTotal,
    cartCustomerId,
  } = req.body;

  if (
    cartProductId !== "" &&
    cartProductPrice !== "" &&
    cartModified !== "" &&
    cartProductCount !== "" &&  
    cartPurchased !== "" &&
    cartProductTotal !== "" &&
    cartCustomerId 
  ) {
    mysqlConnection.query(
      "SELECT cart_product_id FROM cart_table WHERE cart_customer_id = ? AND cart_product_id = ?;",
      [cartCustomerId, cartProductId],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        if (result.length) {
          console.log(result);
          return res.status(400).json({
            success: false,
            message: "Product already in Cart",
          });
        } else {
          const query = `INSERT INTO cart_table (
                cart_product_id, 
                cart_product_price, 
                cart_modified, 
                cart_product_count, 
                cart_purchased, 
                cart_product_total, 
                cart_customer_id)
                VALUES (?, ?, ?, ?, ?, ?, ?);`;
          mysqlConnection.query(
            query,
            [
              cartProductId,
              cartProductPrice,
              new Date(),
              cartProductCount,
              cartPurchased,
              cartProductTotal,
              cartCustomerId,
            ],
            (err, result) => {
              if (err) {
                console.log(err);
                res.send(err);
              } else {
                console.log(result);
                res.json({
                  success: true,
                  data: "Product added to your Cart",
                });
              }
            }
          );
        }
      }
    );
  }
});

router.patch("/cart-update", (req, res) => {
  const {
    cartProductId,
    cartProductPrice,
    cartModified,
    cartProductCount,
    cartPurchased,
    cartProductTotal,
    cartCustomerId,
  } = req.body;
  if (
    cartProductId !== "" &&
    cartProductPrice !== "" &&
    cartModified !== "" &&
    cartProductCount !== "" &&
    cartPurchased !== "" &&
    cartProductTotal !== "" &&
    cartCustomerId
  ) {
    mysqlConnection.query(
      `UPDATE cart_table SET 
        cart_product_price = ?, 
        cart_modified = ?, 
        cart_product_count = ?, 
        cart_purchased = ?, 
        cart_product_total = ?
        WHERE cart_product_id = ? AND cart_customer_id = ?;`,
      [
        cartProductPrice,
        cartModified,
        cartProductCount,
        cartPurchased,
        cartProductTotal,
        cartProductId,
        cartCustomerId,
      ],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        if (result && result.affectedRows) {
          console.log(result);
          return res.status(200).json({
            success: true,
            message: "Cart Updated succesfully",
          });
        }
      }
    );
  }
});

router.delete("/cart-remove/:cartCustomerId/:cartProductId", (req, res) => {
  const { cartProductId, cartCustomerId } = req.params;
  if (cartProductId && cartCustomerId) {
    const query = `DELETE FROM cart_table WHERE cart_product_id = ? && cart_customer_id = ?;`;
    mysqlConnection.query(
      query,
      [cartProductId, cartCustomerId],
      (error, result) => {
        if (error) {
          console.log(error);
          return res.status(400).json({
            success: false,
            error: error,
          });
        } else if (result && result.affectedRows) {
          console.log(result);
          return res.status(200).json({
            success: true,
            message: "Product Deleted from Cart Successfully",
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid Product or Customer",
          });
        }
      }
    );
  } else {
    return res.status(400).json({
      success: false,
      message: "Mandatory fields are empty",
    });
  }
});

module.exports = router;
