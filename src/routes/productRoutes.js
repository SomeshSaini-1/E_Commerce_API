const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  updateReview,
  deleteReview,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  createProductValidators,
  updateProductValidators,
  reviewValidators,
} = require('../validators/productValidators');

router.get('/', getProducts);
router.get('/:id', getProduct);

router.post(
  '/',
  protect,
  authorize('admin'),
  upload.array('images', 5),
  createProductValidators,
  validate,
  createProduct
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.array('images', 5),
  updateProductValidators,
  validate,
  updateProduct
);

router.delete('/:id', protect, authorize('admin'), deleteProduct);

router.post('/:id/reviews', protect, reviewValidators, validate, addReview);
router.put('/:id/reviews/:reviewId', protect, reviewValidators, validate, updateReview);
router.delete('/:id/reviews/:reviewId', protect, deleteReview);

module.exports = router;
