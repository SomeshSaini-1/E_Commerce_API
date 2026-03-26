require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');

const seed = async () => {
  await connectDB();

  await User.deleteMany();
  await Product.deleteMany();

  const adminPassword = await bcrypt.hash('Admin@1234', 12);
  const customerPassword = await bcrypt.hash('Customer@1234', 12);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@ecommerce.com',
    password: adminPassword,
    role: 'admin',
  });

  await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: customerPassword,
    role: 'customer',
  });

  const categories = ['electronics', 'clothing', 'books', 'home', 'sports'];

  const products = Array.from({ length: 10 }, (_, i) => ({
    name: `Sample Product ${i + 1}`,
    description: `This is a detailed description for sample product ${i + 1}. It has many great features.`,
    price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
    category: categories[i % categories.length],
    stock: Math.floor(Math.random() * 100) + 5,
    images: [],
    createdBy: admin._id,
  }));

  await Product.insertMany(products);

  console.log('Database seeded successfully');
  console.log('Admin: admin@ecommerce.com / Admin@1234');
  console.log('Customer: john@example.com / Customer@1234');

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
