const express = require('express');

const authController = require('../controllers/auth');

const { body, check } = require('express-validator');

const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post(
	'/login',
	[
		check('email')
			.isEmail()
			.withMessage('Please use a valid email-id')
			.custom(value => {
				return User.findOne({ email: value }).then(userDoc => {
					if (!userDoc) {
						return Promise.reject('Email does not exist !!! Please Sign-in');
					}
				});
			})
			.trim()
			.normalizeEmail(),
		body('password')
			.isLength({ min: 5, max: 20 })
			.withMessage('Password must be 5 to 20 character length')
			.trim(),
	],
	authController.postLogin,
);
router.post('/logout', authController.postLogout);
router.get('/signup', authController.getSignup);
router.post(
	'/signup',
	[
		body('name')
			.isAlpha()
			.withMessage('Name is alphabate only and length 3 to 20 characters')
			.isLength({ min: 3, max: 20 })
			.withMessage('Name is alphabate only and length 3 to 20 characters')
			.trim(),
		check('email')
			.isEmail()
			.withMessage('Please use a valid email')
			.custom(value => {
				return User.findOne({ email: value }).then(userDoc => {
					if (userDoc) {
						return Promise.reject('Email-ID exist, please use another');
					}
				});
			})
			.trim()
			.normalizeEmail(),
		check('password')
			.isLength({ min: 5, max: 20 })
			.withMessage('Password must be 5 to 20 character length')
			.trim(),
		check('confirmPassword')
			.trim()
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					throw new Error('Confirm Password must match password');
				}
				return true;
			}),
	],
	authController.postSignup,
);
router.get('/resetpassword', authController.getResetPassword);
router.post('/resetpassword', authController.postResetPassword);
router.get('/changepassword/:token', authController.getChangePassword);
router.post('/changepassword', authController.postChangePassword);

module.exports = router;
