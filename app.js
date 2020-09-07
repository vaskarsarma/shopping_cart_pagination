const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now().toString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const errorController = require("./controllers/error");
const User = require("./models/user");

const app = express();

const conUri =
  "mongodb+srv://vaskartest:Q8IDHIa7KzMak1Wi@testvaskar.u4d65.mongodb.net/shop-3?retryWrites=true&w=majority";

const store = new MongoDBStore({
  uri: conUri,
  collection: "sessions",
  expires: 1000 * 60 * 60, // 1hour in milliseconds
});

const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const loginRouters = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: storage, fileFilter: fileFilter }).single("image"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images/", express.static(path.join(__dirname, "images")));
app.use(
  session({
    secret: "my shopiing cart application Secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(csrfProtection);
app.use(flash());

// Usage of local variable
app.use((req, res, next) => {
  console.log("222");
  console.log(req.session);
  res.locals.isAuthenticated =
    req.session && req.session.isLoggedIn ? req.session.isLoggedIn : false;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  console.log("111");
  console.log(req.session);
  if (!req.session.user) return next();

  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(loginRouters);

//app.get(errorController.get500);

app.use(errorController.get404);

// app.use((err, req, res, next) => {
// 	res.status(500).render('500', {
// 		pageTitle: '500 page',
// 		path: '/500',
// 	});
// });

//app.use(errorController.get500);

app.use((err, req, res, next) => {
  console.log("333");
  console.log(req.session);
  console.log(err);
  res.status(500).render("500", {
    pageTitle: "500 page",
    path: "/500",
    isAuthenticated:
      req.session && req.session.isLoggedIn ? req.session.isLoggedIn : false,
  });
});

mongoose
  .connect(conUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log("DB Connectd");
    // User.findOne().then(user => {
    // 	if (!user) {
    // 		const user = new User({
    // 			name: 'Vaskar',
    // 			email: 'Vaskar@test.com',
    // 			cart: {
    // 				items: [],
    // 			},
    // 		});
    // 		user.save();
    // 	}
    // });
    app.listen(3000);
    console.log("Application started at PORT 3000");
  })
  .catch((err) => {
    console.log(err);
  });
