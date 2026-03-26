const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

const getProducts = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { isActive: true };

  if (req.query.category) {
    filter.category = req.query.category.toLowerCase();
  }

  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
  }

  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  const allowedSortFields = ['price', 'createdAt', 'averageRating', 'name'];
  let sort = '-createdAt';

  if (req.query.sort) {
    const sortField = req.query.sort.replace('-', '');
    if (allowedSortFields.includes(sortField)) {
      sort = req.query.sort;
    }
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('-reviews')
    .lean();

  res.status(200).json({
    success: true,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    data: products,
  });
};

const getProduct = async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true })
    .populate('reviews.user', 'name')
    .populate('createdBy', 'name');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({ success: true, data: product });
};

const createProduct = async (req, res, next) => {
  const images = req.files ? req.files.map((f) => `/uploads/products/${f.filename}`) : [];

  const product = await Product.create({
    ...req.body,
    images,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: product });
};

const updateProduct = async (req, res, next) => {
  let product = await Product.findOne({ _id: req.params.id, isActive: true });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  if (req.files && req.files.length > 0) {
    product.images.forEach((img) => {
      const filePath = path.join(__dirname, '../../', img);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    req.body.images = req.files.map((f) => `/uploads/products/${f.filename}`);
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: product });
};

const deleteProduct = async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  product.isActive = false;
  await product.save();

  res.status(200).json({ success: true, message: 'Product deleted successfully' });
};

const addReview = async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    return next(new AppError('You have already reviewed this product', 400));
  }

  product.reviews.push({
    user: req.user._id,
    name: req.user.name,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  product.calculateAverageRating();
  await product.save();

  res.status(201).json({ success: true, data: product });
};

const updateReview = async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const review = product.reviews.find(
    (r) => r._id.toString() === req.params.reviewId
  );

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to update this review', 403));
  }

  review.rating = req.body.rating || review.rating;
  review.comment = req.body.comment || review.comment;

  product.calculateAverageRating();
  await product.save();

  res.status(200).json({ success: true, data: product });
};

const deleteReview = async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const reviewIndex = product.reviews.findIndex(
    (r) => r._id.toString() === req.params.reviewId
  );

  if (reviewIndex === -1) {
    return next(new AppError('Review not found', 404));
  }

  const review = product.reviews[reviewIndex];

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this review', 403));
  }

  product.reviews.splice(reviewIndex, 1);
  product.calculateAverageRating();
  await product.save();

  res.status(200).json({ success: true, message: 'Review deleted successfully' });
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, addReview, updateReview, deleteReview };
