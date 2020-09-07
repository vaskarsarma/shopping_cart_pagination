const Product = require('../models/product');

const FileHelper = require('../util/file');

const { validationResult } = require('express-validator');

const ITEMS_PER_PAGE = 2;

exports.getAddProduct = (req, res, next) => {
	// if (!req.session.isLoggedIn) {
	// 	return res.redirect('/login');
	// }

	let messages = req.flash('error');
	if (messages.length > 0) {
		messages = messages[0];
	} else messages = null;

	res.render('admin/edit-product', {
		pageTitle: 'Add Product',
		path: '/admin/add-product',
		editing: false,
		//isAuthenticated: req.session.isLoggedIn,
		errorMessage: messages,
		oldInput: {
			title: '',
			imageUrl: '',
			price: '',
			description: '',
		},
		validationErrors: [],
	});
};

exports.postAddProduct = (req, res, next) => {
	const title = req.body.title;
	const image = req.file;
	const price = req.body.price;
	const description = req.body.description;

	if (!image || image === 'undefined') {
		return res.status(422).render('admin/edit-product', {
			pageTitle: 'Add Product',
			path: '/admin/add-product',
			editing: false,
			//isAuthenticated: req.session.isLoggedIn,
			errorMessage: 'Please upload one png, jpg or jpeg file.',
			oldInput: {
				title: title,
				imageUrl: '',
				price: price,
				description: description,
			},
			validationErrors: [],
		});
	}

	const imageUrl = image.path;

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).render('admin/edit-product', {
			pageTitle: 'Add Product',
			path: '/admin/add-product',
			editing: false,
			//isAuthenticated: req.session.isLoggedIn,
			errorMessage: errors.array()[0].msg,
			oldInput: {
				title: title,
				imageUrl: image.originalname,
				price: price,
				description: description,
			},
			validationErrors: errors.array(),
		});
	}

	const product = new Product({
		//_id: new mongoose.Types.ObjectId('5f4e6e9d736a910454384148'),
		title: title,
		price: price,
		description: description,
		imageUrl: imageUrl,
		userId: req.user,
	});
	product
		.save()
		.then(result => {
			// console.log(result);
			console.log('Created Product');
			res.redirect('/admin/products');
		})
		.catch(err => {
			//console.log(err);
			//throw new Error(err);
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getEditProduct = (req, res, next) => {
	// if (!req.session.isLoggedIn) {
	// 	return res.redirect('/login');
	// }

	let messages = req.flash('error');
	if (messages.length > 0) {
		messages = messages[0];
	} else messages = null;

	const editMode = req.query.edit;
	if (!editMode) {
		return res.redirect('/');
	}
	const prodId = req.params.productId;
	Product.findOne({ _id: prodId, userId: req.user._id })
		.then(product => {
			if (!product) {
				return res.redirect('/');
			}
			console.log(product);
			res.render('admin/edit-product', {
				pageTitle: 'Edit Product',
				path: '/admin/edit-product',
				editing: editMode,
				product: product,
				//isAuthenticated: req.session.isLoggedIn,
				errorMessage: messages,
				validationErrors: [],
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postEditProduct = (req, res, next) => {
	const prodId = req.body.productId;
	const updatedTitle = req.body.title;
	const updatedPrice = req.body.price;
	const image = req.file;
	const updatedDesc = req.body.description;

	let updatedImageUrl = '';
	if (image) {
		updatedImageUrl = image.path;
	}

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		//console.log(errors);

		return res.status(422).render('admin/edit-product', {
			pageTitle: 'Edit Product',
			path: '/admin/edit-product',
			editing: true,
			//isAuthenticated: req.session.isLoggedIn,
			errorMessage: errors.array()[0].msg,
			product: {
				title: updatedTitle,
				//imageUrl: updatedImageUrl,
				price: updatedPrice,
				description: updatedDesc,
				_id: prodId,
			},
			validationErrors: errors.array(),
		});
	}

	Product.findOne({ _id: prodId, userId: req.user._id })
		.then(product => {
			if (!product) {
				return res.redirect('/');
			}

			product.title = updatedTitle;
			product.price = updatedPrice;
			product.description = updatedDesc;
			if (updatedImageUrl) {
				FileHelper.deleteFile(product.imageUrl);
				product.imageUrl = updatedImageUrl;
			}
			return product.save();
		})
		.then(result => {
			console.log('UPDATED PRODUCT!');
			res.redirect('/admin/products');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getProducts = (req, res, next) => {
	// if (!req.session.isLoggedIn) {
	// 	return res.redirect('/login');
	// }{ userId: req.user._id }

	const page = +req.query.pageId || 1;
	let totalPage = 0;

	Product.find({ userId: req.user._id })
		.countDocuments()
		.then(productCount => {
			totalPage = Math.ceil(productCount / ITEMS_PER_PAGE);

			return Product.find({ userId: req.user._id })
				.skip((page - 1) * ITEMS_PER_PAGE)
				.limit(ITEMS_PER_PAGE);
		})
		.then(products => {
			console.log(products);
			res.render('admin/products', {
				prods: products,
				pageTitle: 'Admin Products',
				path: '/admin/products',
				totalPage: totalPage,
				currentPage: page,
				//isAuthenticated: req.session.isLoggedIn,
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postDeleteProduct = (req, res, next) => {
	const prodId = req.body.productId;

	Product.findById(prodId)
		.then(product => {
			if (!product) return next(new Error('Product not found'));

			FileHelper.deleteFile(product.imageUrl);

			return Product.deleteOne({ _id: prodId, userId: req.user._id });
		})
		.then(results => {
			if (results.deletedCount == 0) {
				return res.redirect('/');
			}
			console.log('DESTROYED PRODUCT');
			// TODO : To check and correct
			return req.user.removeFromCart(prodId);
		})
		.then(() => {
			console.log('DESTROYED PRODUCT from CART List');
			res.redirect('/admin/products');
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};
