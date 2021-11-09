const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const path = require("path")
const mysqlConnection = require("../database/db");
const { createTokens, validateToken } = require("../utils/JWT");
const dotenv = require("dotenv");
const fs = require("fs");
dotenv.config();


const { saltRounds } = require("../utils/constants.js");

/**
 * IMAGES ARE SERVED AT http://localhost:5500/seller-images/2021-10-30T11:25:41.302Z-kitten.png
 */

// TO UPLOAD SELLER IMAGE
router.post("/seller-image", (req, res) => {
  const { sellerPic } = req.files;
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No Files are uploaded");
  }
  const fileName = `${new Date().toISOString()}-${sellerPic.name}`;
  const uploadPath = path.join(
    __dirname,
    "..",
    "static",
    "seller-images",
    fileName
  );
  sellerPic.mv(uploadPath, (err) => {
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

// TO DELETE SELLER IMAGE
router.delete("/seller-image-delete/:sellerPic", (req, res) => {
  const { sellerPic } = req.params;

  try {
    fs.unlinkSync(
      path.join(__dirname, "..", "static", "seller-images", sellerPic)
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

// SELLER REGISTER API
router.post("/seller-register", (req, res) => {
  const {
    sellerName,
    sellerPassword,
    sellerEmail,
    sellerEditDate,
    sellerBankName,
    sellerAccountNumber,
    sellerMobileNumber,
    sellerAddress,
    sellerFirmName,
    sellerProfilePic,
    sellerFirmInfo,
    sellerFirmAddress,
  } = req.body;

  if (
    sellerName !== "" &&
    sellerEmail !== "" &&
    sellerPassword !== "" &&
    sellerEditDate !== "" &&
    sellerBankName !== "" &&
    sellerAccountNumber !== "" &&
    sellerAddress !== "" &&
    sellerFirmName !== "" &&
    sellerFirmAddress !== ""
  ) {
    mysqlConnection.query(
      "SELECT seller_email FROM seller_table WHERE seller_email = ?",
      [sellerEmail],
      async (error, result) => {
        if (error) {
          console.log(error);
        }
        if (result.length) {
          return res.status(400).json({
            success: false,
            message: "Email already registered please try Signing In",
          });
        } else {
          await bcrypt.hash(sellerPassword, saltRounds, function (err, hash) {
            if (err) {
              console.log(err);
            }
            // Store hash in your password DB.
            const hashedPassword = hash;
            const query = `INSERT INTO seller_table (
                  seller_name, 
                  seller_email, 
                  seller_pass, 
                  seller_reg_date, 
                  seller_edit_date, 
                  seller_bank_name, 
                  seller_account_number, 
                  seller_mob_no, 
                  seller_address, 
                  seller_firm_name, 
                  seller_firm_address, 
                  seller_profile_pic, 
                  seller_firm_info) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
            mysqlConnection.query(
              query,
              [
                sellerName,
                sellerEmail,
                hashedPassword,
                new Date(),
                new Date(),
                sellerBankName,
                sellerAccountNumber,
                sellerMobileNumber,
                sellerAddress,
                sellerFirmName,
                sellerFirmAddress,
                sellerProfilePic,
                sellerFirmInfo,
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

// SELLER LOGIN API
router.post("/seller-login", async (req, res) => {
  const { sellerEmail, sellerPassword } = req.body;
  await mysqlConnection.query(
    `SELECT 
    seller_email, 
    seller_id, 
    seller_pass,
    seller_name,
    seller_reg_date,
    seller_edit_date,
    seller_bank_name,
    seller_account_number,
    seller_mob_no,
    seller_address,
    seller_firm_name,
    seller_firm_address,
    seller_firm_info,
    seller_profile_pic
    FROM seller_table WHERE seller_email = ?;`,
    [sellerEmail],
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
        const hashedPassword = result[0].seller_pass;
        bcrypt.compare(sellerPassword, hashedPassword).then((match) => {
          if (!match) {
            res.status(400).json({
              status: false,
              message: "Email or Password Incorrect",
            });
          } else {
            const tokenObject = {
              email: result[0].seller_email,
              pass: result[0].seller_pass,
              id: result[0].seller_id,
              role: "seller",
            };
            const accessToken = createTokens(tokenObject);
            console.log(tokenObject, accessToken);

            res.cookie(process.env.cookieName, accessToken, {
              maxAge: 60 * 60 * 24 * 30 * 1000,
              httpOnly: true,
            });
            const sellerData = result[0];
            delete sellerData["seller_pass"];
            res.json({
              success: true,
              data: { accessToken: accessToken, sellerData: sellerData },
            });
          }
        });
      }
    }
  );
});

// SELLER UPDATE API
router.patch("/seller-update", async (req, res) => {
  const {
    sellerId,
    sellerName,
    sellerEmail,
    sellerEditDate,
    sellerBankName,
    sellerAccountNumber,
    sellerMobileNumber,
    sellerAddress,
    sellerFirmName,
    sellerProfilePic,
    sellerPassword,
    sellerFirmInfo,
    sellerFirmAddress,
  } = req.body;

  if (
    sellerName !== "" &&
    sellerEmail !== "" &&
    sellerEditDate !== "" &&
    sellerBankName !== "" &&
    sellerAccountNumber &&
    sellerAddress !== "" &&
    sellerFirmName !== "" &&
    sellerFirmAddress !== "" &&
    sellerId &&
    sellerPassword !== ""
  ) {
    await mysqlConnection.query(
      "SELECT seller_email, seller_id, seller_pass FROM seller_table WHERE seller_id = ? AND seller_email = ?;",
      [sellerId, sellerEmail],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        if (!result.length) {
          return res.status(400).json({
            success: false,
            message: "Invalid User Details",
          });
        } else {
          const hashedPassword = result[0].seller_pass;
          bcrypt.compare(sellerPassword, hashedPassword).then((match) => {
            if (!match) {
              res.status(400).json({
                status: false,
                message: "Email or Password Incorrect",
              });
            } else {
              const query = `UPDATE seller_table SET 
                  seller_name = ?, 
                  seller_edit_date = ?, 
                  seller_bank_name = ?, 
                  seller_account_number = ?, 
                  seller_mob_no = ?, 
                  seller_address = ?, 
                  seller_firm_name = ?, 
                  seller_firm_address = ?, 
                  seller_profile_pic = ?, 
                  seller_firm_info = ?
                WHERE seller_id = ? AND seller_email = ?;`;
              mysqlConnection.query(
                query,
                [
                  sellerName,
                  new Date(),
                  sellerBankName,
                  sellerAccountNumber,
                  sellerMobileNumber,
                  sellerAddress,
                  sellerFirmName,
                  sellerFirmAddress,
                  sellerProfilePic,
                  sellerFirmInfo,
                  sellerId,
                  sellerEmail,
                ],
                (error, result) => {
                  if (error) {
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
      error: "Mandatory fields can not be empty",
    });
  }
});

router.get("/seller-products/:sellerId", (req, res) => {
  const { sellerId } = req.params;
  const query = `SELECT * FROM product_table WHERE product_seller_id = ?;`;
  mysqlConnection.query(query, [sellerId], (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({
        success: false,
        error: error,
      });
    } else if (result && result.length) {
      console.log(result);
      res.status(200).json({
        success: true,
        data: result,
      });
    }
  });
});

module.exports = router;
