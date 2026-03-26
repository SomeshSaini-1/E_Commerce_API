const { body } = require('express-validator');

const createProductValidators = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 100 }).withMessage('Name max 100 chars'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }).withMessage('Description max 2000 chars'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

const updateProductValidators = [
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Name max 100 chars'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description max 2000 chars'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

const reviewValidators = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Review comment is required').isLength({ max: 500 }).withMessage('Comment max 500 chars'),
];

module.exports = { createProductValidators, updateProductValidators, reviewValidators };
