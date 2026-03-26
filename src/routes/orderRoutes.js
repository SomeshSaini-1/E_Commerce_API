const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderValidators } = require('../validators/orderValidators');

router.use(protect);

router.post('/', createOrderValidators, validate, createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrder);

router.get('/', authorize('admin'), getAllOrders);
router.put('/:id/status', authorize('admin'), updateOrderStatus);

module.exports = router;
