const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

const createOrder = async (req, res, next) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError('No order items provided', 400));
  }

  const productIds = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });

  if (products.length !== items.length) {
    return next(new AppError('One or more products not found', 404));
  }

  const orderItems = [];
  let itemsPrice = 0;

  for (const item of items) {
    const product = products.find((p) => p._id.toString() === item.product);

    if (product.stock < item.quantity) {
      return next(new AppError(`Insufficient stock for product: ${product.name}`, 400));
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      quantity: item.quantity,
      price: product.price,
      image: product.images[0] || '',
    });

    itemsPrice += product.price * item.quantity;
  }

  const taxPrice = parseFloat((itemsPrice * 0.1).toFixed(2));
  const shippingPrice = itemsPrice > 100 ? 0 : 10;
  const totalPrice = parseFloat((itemsPrice + taxPrice + shippingPrice).toFixed(2));

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }

  res.status(201).json({ success: true, data: order });
};

const getMyOrders = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const total = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .populate('items.product', 'name images');

  res.status(200).json({
    success: true,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    data: orders,
  });
};

const getOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('items.product', 'name images');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to view this order', 403));
  }

  res.status(200).json({ success: true, data: order });
};

const getAllOrders = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email');

  res.status(200).json({
    success: true,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    data: orders,
  });
};

const updateOrderStatus = async (req, res, next) => {
  const { status } = req.body;

  const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return next(new AppError('Invalid order status', 400));
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    return next(new AppError(`Cannot update a ${order.status} order`, 400));
  }

  order.status = status;

  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  if (status === 'cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }

  await order.save();

  res.status(200).json({ success: true, data: order });
};

module.exports = { createOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus };
