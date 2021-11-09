const express = require("express");
const router = express.Router();
const mysqlConnection = require("../database/db");
const path = require("path");
const fs = require("fs");

/**
 * IMAGES ARE SERVED AT http://localhost:5500/product-images/2021-10-30T11:25:41.302Z-kitten.png
 */

// TO UPLOAD PRODUCT IMAGE
router.post("/product-image", (req, res) => {
  const { productPic } = req.files;
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No Files are uploaded");
  }
  const fileName = `${new Date().toISOString()}-${productPic.name}`;
  const uploadPath = path.join(
    __dirname,
    "..",
    "static",
    "product-images",
    fileName
  );
  productPic.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).json({
        success: true,
        message: "Image Uploaded successFully",
        fileName: fileName,
        uploadPath: uploadPath,
      });
    }
  });
});

// TO DELETE PRODUCT IMAGE
router.delete("/product-image-delete/:productPic", (req, res) => {
  const { productPic } = req.params;

  try {
    fs.unlinkSync(
      path.join(__dirname, "..", "static", "product-images", productPic)
    );

    res.status(201).send({ message: "Image deleted" });
  } catch (e) {
    res.status(400).send({
      message: "Error deleting image!",
      error: e.toString(),
      req: req.body,
    });
  }
});

// PRODUCT REGISTER API
router.post("/product-register", async (req, res) => {
  const {
    productName,
    productCategory,
    productPrice,
    productMaxPrice,
    productSellerId,
    productCountStock,
    productUpdateDate,
    productAbout,
    productPic,
  } = req.body;

  if (
    productName !== "" &&
    productCategory !== "" &&
    productPrice !== "" &&
    productMaxPrice !== "" &&
    productSellerId !== "" &&
    productCountStock !== "" &&
    productUpdateDate !== ""
  ) {
    await mysqlConnection.query(
      `SELECT seller_id FROM seller_table WHERE seller_id = ?`,
      [productSellerId],
      async (error, result, fields) => {
        if (error || !result.length) {
          console.log(error, result, fields);
          return res.status(400).json({
            success: false,
            message:
              "Unauthorized Seller, Please Sign In with an authorized account.",
          });
        } else if (result.length) {
          console.log(result, fields);
          const query = `INSERT INTO product_table (
            product_category, 
            product_name,
            product_about,
            product_price,
            product_pic,
            product_max_price,
            product_seller_id,
            product_count_stock,
            product_reg_date,
            product_update_date) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
          await mysqlConnection.query(
            query,
            [
              productCategory,
              productName,
              productAbout,
              productPrice,
              productPic,
              productMaxPrice,
              productSellerId,
              productCountStock,
              new Date(),
              new Date(),
            ],
            (err, result) => {
              if (err) {
                console.log(err);
                res.status(400).json({
                  success: false,
                  error: err,
                });
              } else {
                console.log(result);
                res.status(200).json({
                  success: true,
                  data: result,
                });
              }
            }
          );
        }
      }
    );
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Mandatory Fields are Empty" });
  }
});

// PRODUCT UPDATE API
router.patch("/product-update", (req, res) => {
  const {
    productName,
    productCategory,
    productPrice,
    productMaxPrice,
    productSellerId,
    productCountStock,
    // productUpdateDate,
    productAbout,
    productPic,
    productId,
  } = req.body;

  if (
    productName !== "" &&
    productCategory !== "" &&
    productPrice !== "" &&
    productMaxPrice !== "" &&
    productSellerId !== "" &&
    productCountStock !== "" &&
    // productUpdateDate !== "" &&
    productId !== "" &&
    productId &&
    productSellerId
  ) {
    const query = `UPDATE product_table SET 
    product_category = ?, 
    product_name = ?,
    product_about = ?,
    product_price = ?,
    product_pic = ?,
    product_max_price = ?,
    product_count_stock = ?,
    product_update_date = ?
  WHERE product_id = ?;`;
    mysqlConnection.query(
      query,
      [
        productCategory,
        productName,
        productAbout,
        productPrice,
        productPic,
        productMaxPrice,
        productCountStock,
        new Date(),
        productId,
      ],
      (error, result, fields) => {
        if (error) {
          console.log(error);
          return res.status(400).json({
            success: false,
            message: error,
          });
        } else if (result && result.affectedRows) {
          console.log(result, fields);
          res
            .status(200)
            .json({ success: true, message: "Product updated successfully" });
        } else {
          res.status(400).json({
            success: false,
            message: "Product doesn't exist or invalid Seller",
          });
        }
      }
    );
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Mandatory Fields are Empty" });
  }
});

// DELETE PRODUCT API
router.delete("/product-delete/:productSellerId/:productId", (req, res) => {
  const { productId, productSellerId } = req.params;
  console.log(productId, productSellerId);
  if (productId && productSellerId) {
    const query = `DELETE FROM product_table WHERE product_id = ? && product_seller_id = ?;`;
    mysqlConnection.query(
      query,
      [productId, productSellerId],
      (error, result) => {
        if (error) {
          console.log(error);
          return res.status(400).json({
            success: false,
            error: error,
          });
        } else if (result && result.affectedRows) {
          console.log(result);
          return res
            .status(200)
            .json({ success: true, message: "Product Deleted Successfully" });
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid Product or Seller",
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

router.get("/product-count-cart/:productId", (req, res) => {
  const { productId } = req.params;
  const query = `SELECT COUNT(*) 
                FROM cart_table
                WHERE cart_product_id = ?;`;
  mysqlConnection.query(query, [productId], (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({
        success: false,
        error: error,
      });
    } else if (result) {
      console.log(result);
      res.status(200).json({
        success: true,
        data: result,
      });
    }
  });
});

router.get("/product-count-transc/:productId", (req, res) => {
  const { productId } = req.params;
  const query = `SELECT COUNT(*) 
                FROM transaction_table
                WHERE transc_product_id = ?;`;
  mysqlConnection.query(query, [productId], (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({
        success: false,
        error: error,
      });
    } else if (result) {
      console.log(result);
      res.status(200).json({
        success: true,
        data: result,
      });
    }
  });
});

module.exports = router;
