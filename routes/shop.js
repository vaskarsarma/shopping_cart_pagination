const path = require("path");

const express = require("express");

const shopController = require("../controllers/shop");

const authCheck = require("../middleware/is_auth");

const router = express.Router();

router.get("/", shopController.getIndex);

router.get("/products", shopController.getProducts);

router.get("/products/:productId", shopController.getProduct);

router.get("/cart", authCheck, shopController.getCart);

router.post("/cart", authCheck, shopController.postCart);

router.post(
  "/cart-delete-item",
  authCheck,
  shopController.postCartDeleteProduct
);

router.post("/create-order", authCheck, shopController.postOrder);

router.get("/orders", authCheck, shopController.getOrders);

router.get("/orders/:invoice", authCheck, shopController.getInvoice);

module.exports = router;
