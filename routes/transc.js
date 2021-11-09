const express = require("express");
const mysqlConnection = require("../database/db");
const router = express.Router();

router.get("/transc-all/:customerId", (req, res) => {
  const { customerId } = req.params;
  if (customerId) {
    mysqlConnection.query(
      `SELECT * FROM transaction_table WHERE transc_customer_id = ?;`,
      [customerId],
      (error, result) => {
        if (error) {
          console.log(error);
          return res.status(400).json({
            success: false,
            message: error,
          });
        } else if (result && result.length) {
          console.log(result);
          res.status(200).json({
            success: true,
            data: result,
          });
        } else {
          res.status(400).json({
            success: false,
            message: "No Orders found",
          });
        }
      }
    );
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid User",
    });
  }
});

router.post("/transc-add", async (req, res) => {
  const { transactionProductsArray } = req.body;


  if (transactionProductsArray && transactionProductsArray.length) {
    await transactionProductsArray.forEach(async (transcProduct) => {
      const {
        transcProductName,
        transcProductId,
        transcProductPrice,
        transcProductCount,
        transcTotalPrice,
        transcSellerId,
        transcCustomerId,
        transcInvoiceNumber,
        transcShippingAddress,
      } = transcProduct;
      if (
        transcProductName === "" ||
        !transcProductId ||
        !transcProductPrice ||
        !transcProductCount ||
        !transcTotalPrice ||
        !transcSellerId ||
        !transcCustomerId ||
        transcInvoiceNumber === "" ||
        transcShippingAddress === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more Product has missing details",
        });
      }
    });

    let values = transactionProductsArray.reduce((valueArray, item) => {
      let ini = [];
      ini.push(new Date());
      ini.push(item.transcProductId);
      ini.push(item.transcTotalPrice);
      ini.push(item.transcSellerId);
      ini.push(item.transcCustomerId);
      ini.push(item.transcInvoiceNumber);
      ini.push(item.transcShippingAddress);
      ini.push(item.transcProductCount);
      ini.push(item.transcProductPrice);
      ini.push(item.transcProductName);
      valueArray.push(ini);
      return valueArray;
    }, []);
    console.log(values);
    const query = `INSERT INTO transaction_table (
      transc_date, 
      transc_product_id,
      transc_total_price,
      transc_seller_id,
      transc_customer_id,
      transc_invoice_number,
      transc_shipping_address,
      transc_product_count,
      transc_product_price,
      transc_product_name) 
    VALUES ?;`;
    await mysqlConnection.query(query, [values], (error, result) => {
      console.log(error, result);
      if (error) {
        console.log(error);
        return res.status(400).json({
          success: false,
          message: error,
        });
      } else if (result && result.affectedRows) {
        console.log(result);
        return res.status(200).json({
          success: true,
          message: "Order Placed Successfully for all Product",
        });
      }
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid Data supplied",
    });
  }
});

module.exports = router;
