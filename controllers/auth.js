const crypto = require("crypto");

const User = require("../models/user");
const bcrypt = require("bcryptjs");

const { validationResult } = require("express-validator");

/** code added to send mail via GMAIL */
const nodemailer = require("nodemailer");
const mailer = nodemailer.createTransport({
  //service: 'gmail',
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "vaskarsarma2020@gmail.com",
    pass: "Matrix@2020",
  },
});
/** code added to send mail via SENDGRID */
// const sgTransport = require('nodemailer-sendgrid-transport');
// const options = {
// 	auth: {
// 		api_key:
// 			'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',
// 	},
// };
// const mailer = nodemailer.createTransport(sgTransport(options));

exports.getLogin = (req, res, next) => {
  //console.log(req.session.user);
  //let isLoggedIn = req.session.isLoggedIn;
  // if (req.headers['cookie'] && req.headers['cookie'].trim()) {
  // 	isLoggedIn = req.headers['cookie'].trim().split('=')[1];
  // }
  //console.log(isLoggedIn);

  let messages = req.flash("error");
  if (messages.length > 0) {
    messages = messages[0];
  } else messages = null;

  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    errorMessage: messages,
    oldInput: {
      email: "",
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  //res.setHeader('Set-Cookie', 'loggedIn=true; httpOnly');
  //req.session.isLoggedIn = true;

  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("1");
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      path: "/login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
      },
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      console.log("2");
      if (user) {
        console.log("3");
        return bcrypt
          .compare(password, user.password)
          .then((doMatch) => {
            console.log("4");
            if (doMatch) {
              console.log("5");
              req.session.isLoggedIn = true;
              req.session.user = user;
              return req.session.save((err) => {
                if (err) {
                  console.log("6");
                  console.log(err);
                }
                console.log("7");
                res.redirect("/");
              });
            } else {
              console.log("8");

              //   return req.session.destroy((err) => {
              //     if (err) console.log("9");
              //   })
              //req.flash('error', 'Invalid email or password');
              //return res.redirect('/login');
              return res.status(422).render("auth/login", {
                pageTitle: "Login",
                path: "/login",
                errorMessage: "Invalid email or password",
                oldInput: {
                  email: email,
                },
                validationErrors: [{ param: "email" }, { param: "password" }],
              });
            }
          })
          .catch((err) => {
            console.log("9");
            //req.flash('error', 'Invalid email or password');
            console.log(err);
            //res.redirect('/login');
            return res.status(422).render("auth/login", {
              pageTitle: "Login",
              path: "/login",
              errorMessage: "Invalid email or password",
              oldInput: {
                email: email,
              },
              validationErrors: [{ param: "email" }, { param: "password" }],
            });
          });
      } else {
        console.log("10");
        //req.flash('error', 'Invalid email or password');
        //return res.redirect('/login');
        return res.status(422).render("auth/login", {
          pageTitle: "Login",
          path: "/login",
          errorMessage: "Invalid email or password",
          oldInput: {
            email: email,
          },
          validationErrors: [{ param: "email" }, { param: "password" }],
        });
      }
    })
    .catch((err) => {
      console.log("11");
      //req.flash('error', 'Invalid email or password');
      //console.log(err);
      //res.redirect('/');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    //console.log(err);
    res.redirect("/");
    // const error = new Error(err);
    // error.httpStatusCode = 500;
    // return next(error);
  });
};

exports.getSignup = (req, res, next) => {
  let messages = req.flash("error");
  if (messages.length > 0) {
    messages = messages[0];
  } else messages = null;

  res.render("auth/signup", {
    pageTitle: "Signup",
    path: "/signup",
    errorMessage: messages,
    oldInput: {
      name: "",
      email: "",
    },
    validationErrors: [],
  });
};

exports.postSignup = (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  console.log(name, email, password, confirmPassword);

  const errors = validationResult(req);
  console.log(errors);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      pageTitle: "Signup",
      path: "/signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        name: name,
        email: email,
      },
      validationErrors: errors.array(),
    });
  }
  // if (password !== confirmPassword) {
  // 	req.flash('error', 'Password mismatched');
  // 	return res.redirect('/signup');
  // }

  const emailInfo = {
    to: email,
    from: "vaskarsarma2020@gmail.com",
    subject: "Welcome - node-js shopping cart",
    text: "Congratualtions!!! Welcome to node js shopping cart",
    html: "<b>Congratualtions!!! Welcome to node js shopping cart</b>",
  };

  // User.findOne({ email: email })
  // 	.then(userDoc => {
  // 		if (userDoc) {
  // 			req.flash('error', 'Email-ID exist, please use another.');
  // 			return res.redirect('/signup');
  // 		}

  return bcrypt.hash(password, 12, (err, hash) => {
    if (!err) {
      const user = new User({
        name: name,
        email: email,
        password: hash,
        cart: { items: [] },
      });

      return user
        .save()
        .then((result) => {
          console.log(result);
          res.redirect("/login");
          mailer.sendMail(emailInfo, function (err, res) {
            if (err) {
              console.log(err);
            }
          });
        })
        .catch((err) => {
          req.flash("error", "Signup failed, please try again");
          console.log(err);
          res.redirect("/signup");
        });
    }
  });
  // })
  // .catch(err => {
  // 	req.flash('error', 'Signup failed, please try again');
  // 	console.log(err);
  // 	res.redirect('/signup');
  // });
};

exports.getResetPassword = (req, res, next) => {
  let messages = req.flash("error");
  if (messages.length > 0) {
    messages = messages[0];
  } else messages = null;

  res.render("auth/resetpassword", {
    pageTitle: "Reset Password",
    path: "/resetpassword",
    errorMessage: messages,
  });
};

exports.postResetPassword = (req, res, next) => {
  const email = req.body.email;
  console.log(email);
  if (!email) {
    req.flash("error", "Please enter a valid email id");
    return res.redirect("/resetpassword");
  }

  // Create Token
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      req.flash("error", "Technical error !! Please try again");
      console.log(err);
      return res.redirect("/resetpassword");
    }

    const resetToken = buffer.toString("hex");
    console.log(resetToken);

    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          req.flash("error", "Email-ID does not exist!!! Please Signup");
          return res.redirect("/resetpassword");
        }

        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000;

        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        const emailInfo = {
          to: email,
          from: "vaskarsarma2020@gmail.com",
          subject: "Reset Password",
          text: "Reset Password",
          html: `<p>You have inititiated password reset</p>
				<p>To reset password please <a href="http://localhost:3000/changepassword/${resetToken}">click here</a></p>
				<p>Above link is valid for next 1hr.</p>`,
        };

        mailer.sendMail(emailInfo, function (err, res) {
          if (err) {
            //req.flash('error', 'Email sent failed, please try again.');
            //console.log(err);
            //res.redirect('/resetpassword');
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          }
        });
      })
      .catch((err) => {
        //console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getChangePassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } })
    .then((user) => {
      let messages = req.flash("error");
      if (messages.length > 0) {
        messages = messages[0];
      } else messages = null;

      res.render("auth/changepassword", {
        pageTitle: "Change Password",
        path: "/changepassword",
        resettoken: req.params.token,
        userid: user._id.toString(),
        errorMessage: messages,
      });
    })
    .catch((err) => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postChangePassword = (req, res, next) => {
  const userid = req.body.userid;
  const resettoken = req.body.resettoken;
  const newpassword = req.body.password;
  let resetUser = {};

  User.findOne({
    _id: userid,
    resetToken: resettoken,
    resetTokenExpiry: { $gt: Date.now() },
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newpassword, 12);
    })
    .then((hashpassword) => {
      resetUser.password = hashpassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiry = undefined;

      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
