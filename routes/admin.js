const path = require("path");

const express = require("express");

const adminController = require("../controllers/admin");

const authCheck = require("../middleware/is_auth");

const { check, body } = require("express-validator");

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", authCheck, adminController.getAddProduct);

// /admin/products => GET
router.get("/products", authCheck, adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  authCheck,
  [
    body("title")
      .isLength({ min: 3, max: 20 })
      .withMessage("Please add title of 3 to 20 chracters length")
      .isString()
      .trim(),
    body("price").isFloat().withMessage("Please add only numbers").trim(),
    body("description")
      .isLength({ min: 5, max: 100 })
      .withMessage("Please add description")
      .isString()
      .trim(),
  ],
  adminController.postAddProduct
);

router.get(
  "/edit-product/:productId",
  authCheck,
  adminController.getEditProduct
);

router.post(
  "/edit-product",
  authCheck,
  [
    body("title")
      .isLength({ min: 3, max: 20 })
      .withMessage("Please add title of 3 to 20 chracters length")
      .isString()
      .trim(),
    body("price").isFloat().withMessage("Please add only numbers").trim(),
    body("description")
      .isLength({ min: 5, max: 100 })
      .withMessage("Please add description")
      .isString()
      .trim(),
  ],
  adminController.postEditProduct
);

router.post("/delete-product", authCheck, adminController.postDeleteProduct);

module.exports = router;
