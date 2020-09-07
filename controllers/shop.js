const fs = require("fs");
const path = require("path");

const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const Order = require("../models/order");
//const order = require("../models/order");

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      console.log(products);
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        //isAuthenticated: req.session.isLoggedIn,
        //csrfToken: req.csrfToken(),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
        //isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        //isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  // if (!req.session.isLoggedIn) {
  // 	return res.redirect('/login');
  // }

  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
        //isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  // if (!req.session.isLoggedIn) {
  // 	return res.redirect('/login');
  // }

  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
        //isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.invoice;
  console.log(orderId);
  Order.findById(orderId, (err, order) => {
    if (err) {
      return next(err);
    }
    if (!order) {
      return next(new Error("Order not found"));
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error("Unauthorized access to invoice"));
    }

    const invoiceName = "invoice-" + orderId + ".pdf";
    const invoicePath = path.join("data", "invoices", invoiceName);

    console.log(invoicePath);

    const invoiceDoc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=" + invoiceName);
    invoiceDoc.pipe(fs.createWriteStream(invoicePath));
    invoiceDoc.pipe(res);

    // Add Orders details in the invoice
    invoiceDoc.fontSize(25).text("My Order", {
      align: "left",
    });

    invoiceDoc.text("--------------------------------------");

    let totalPrice = 0;

    order.products.forEach((p) => {
      totalPrice += p.product.price * p.quantity;
      invoiceDoc
        .fontSize(12)
        .text(p.product.title + " : $" + p.product.price + " x " + p.quantity);
    });

    invoiceDoc.text("--------------------------------------");

    invoiceDoc.fontSize(20).text("Total Price : $" + totalPrice);

    // //Add text
    // invoiceDoc.fontSize(25).text("My Invoice");
    // invoiceDoc.fontSize(14).text("Hello World");

    // //Adde image
    // invoiceDoc.image("images/1599426912637-download.jpg", {
    //   fit: [300, 300],
    //   align: "center",
    //   valign: "center",
    // });

    // //Add new page
    // invoiceDoc
    //   .addPage()
    //   .fontSize(25)
    //   .text("Here is some vector graphics...", 100, 100);

    invoiceDoc.end();

    // fs.readFile(invoicePath, (err, data) => {
    //   if (err) return next(err);
    //   //res.setHeader("Content-Type", "application/pdf");
    //   res.setHeader("Content-Type", "text/plain");
    //   res.setHeader(
    //     "Content-Disposition",
    //     "attachment; filename=" + invoiceName
    //   );
    //   res.send(data);
    // });

    // const fsStream = fs.createReadStream(invoicePath);
    // res.setHeader("Content-Type", "text/plain");
    // res.setHeader("Content-Disposition", "inline; filename=" + invoiceName);

    // fsStream.pipe(res);
  });
};
