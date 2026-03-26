# E-Commerce Backend API

A secure, production-ready RESTful API built with Node.js, Express, MongoDB, and JWT.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (Access + Refresh tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **File Uploads**: multer
- **Email**: nodemailer
- **Rate Limiting**: express-rate-limit

---

## Project Structure

```
ecommerce-api/
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── rateLimiter.js        # Rate limiting config
│   ├── controllers/
│   │   ├── authController.js     # Auth logic
│   │   ├── productController.js  # Product logic
│   │   └── orderController.js    # Order logic
│   ├── middleware/
│   │   ├── auth.js               # JWT protect + authorize
│   │   ├── errorHandler.js       # Global error handler
│   │   ├── upload.js             # Multer file upload
│   │   └── validate.js           # Validation middleware
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Product.js            # Product + Review schema
│   │   └── Order.js              # Order schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── orderRoutes.js
│   ├── utils/
│   │   ├── AppError.js           # Custom error class
│   │   ├── email.js              # Email utility
│   │   ├── jwt.js                # JWT helpers
│   │   └── seeder.js             # DB seeder
│   ├── validators/
│   │   ├── authValidators.js
│   │   ├── productValidators.js
│   │   └── orderValidators.js
│   ├── app.js                    # Express app setup
│   └── server.js                 # Entry point
├── uploads/
│   └── products/                 # Uploaded images
├── .env.example
├── .gitignore
├── package.json
└── postman-collection.json
```

---

## Setup & Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd ecommerce-api

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Seed the database (optional)
npm run seed

# 5. Start development server
npm run dev

# 6. Start production server
npm start
```

---

## Environment Variables

| Variable             | Description                        | Example                          |
|----------------------|------------------------------------|----------------------------------|
| `PORT`               | Server port                        | `5000`                           |
| `NODE_ENV`           | Environment mode                   | `development` / `production`     |
| `MONGO_URI`          | MongoDB connection string          | `mongodb://localhost:27017/ecom` |
| `JWT_SECRET`         | Access token secret                | `your_secret`                    |
| `JWT_EXPIRE`         | Access token expiry                | `15m`                            |
| `JWT_REFRESH_SECRET` | Refresh token secret               | `your_refresh_secret`            |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry               | `7d`                             |
| `SMTP_HOST`          | Mail server host                   | `smtp.mailtrap.io`               |
| `SMTP_PORT`          | Mail server port                   | `2525`                           |
| `SMTP_USER`          | Mail server user                   | `mailtrap_user`                  |
| `SMTP_PASS`          | Mail server password               | `mailtrap_pass`                  |
| `FROM_EMAIL`         | Sender email address               | `noreply@ecommerce.com`          |
| `FROM_NAME`          | Sender display name                | `EcommerceAPI`                   |
| `CLIENT_URL`         | Frontend URL for password reset    | `http://localhost:3000`          |

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

---

### Authentication

| Method | Endpoint                         | Auth     | Description                    |
|--------|----------------------------------|----------|--------------------------------|
| POST   | `/auth/register`                 | Public   | Register a new user            |
| POST   | `/auth/login`                    | Public   | Login and receive tokens       |
| POST   | `/auth/refresh-token`            | Public   | Refresh access token           |
| POST   | `/auth/forgot-password`          | Public   | Send password reset email      |
| PUT    | `/auth/reset-password/:token`    | Public   | Reset password with token      |
| POST   | `/auth/logout`                   | Customer | Invalidate refresh token       |
| GET    | `/auth/me`                       | Customer | Get current user profile       |
| PUT    | `/auth/me`                       | Customer | Update current user profile    |

#### POST /auth/register
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password@123"
}
```
**Response 201**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com", "role": "customer" }
}
```

#### POST /auth/login
```json
{ "email": "jane@example.com", "password": "Password@123" }
```

#### POST /auth/refresh-token
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }
```

---

### Products

| Method | Endpoint                            | Auth     | Description               |
|--------|-------------------------------------|----------|---------------------------|
| GET    | `/products`                         | Public   | Get all products          |
| GET    | `/products/:id`                     | Public   | Get single product        |
| POST   | `/products`                         | Admin    | Create product            |
| PUT    | `/products/:id`                     | Admin    | Update product            |
| DELETE | `/products/:id`                     | Admin    | Soft-delete product       |
| POST   | `/products/:id/reviews`             | Customer | Add a review              |
| PUT    | `/products/:id/reviews/:reviewId`   | Customer | Update own review         |
| DELETE | `/products/:id/reviews/:reviewId`   | Customer | Delete own review         |

#### GET /products — Query Parameters

| Parameter  | Type   | Description                          | Example               |
|------------|--------|--------------------------------------|-----------------------|
| `page`     | Number | Page number (default: 1)             | `?page=2`             |
| `limit`    | Number | Results per page (default: 10)       | `?limit=20`           |
| `category` | String | Filter by category                   | `?category=electronics` |
| `minPrice` | Number | Minimum price filter                 | `?minPrice=50`        |
| `maxPrice` | Number | Maximum price filter                 | `?maxPrice=500`       |
| `sort`     | String | Sort field (`price`,`-price`,`createdAt`) | `?sort=-price`   |
| `search`   | String | Full-text search (name + description)| `?search=laptop`      |

#### POST /products (multipart/form-data)
```
name=Gaming Laptop Pro
description=High performance gaming laptop
price=1499.99
category=electronics
stock=25
images=<file1>
images=<file2>
```

#### POST /products/:id/reviews
```json
{ "rating": 5, "comment": "Excellent product!" }
```

---

### Orders

| Method | Endpoint                  | Auth     | Description                  |
|--------|---------------------------|----------|------------------------------|
| POST   | `/orders`                 | Customer | Create a new order           |
| GET    | `/orders/my-orders`       | Customer | Get current user's orders    |
| GET    | `/orders/:id`             | Customer | Get specific order           |
| GET    | `/orders`                 | Admin    | Get all orders               |
| PUT    | `/orders/:id/status`      | Admin    | Update order status          |

#### POST /orders
```json
{
  "items": [
    { "product": "64abc123...", "quantity": 2 }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "paymentMethod": "card"
}
```

#### PUT /orders/:id/status (Admin)
```json
{ "status": "shipped" }
```
Valid statuses: `pending` → `processing` → `shipped` → `delivered` | `cancelled`

---

## Security Features

- **JWT dual-token strategy** — short-lived access tokens (15m) + long-lived refresh tokens (7d)
- **bcryptjs** — passwords hashed with cost factor 12
- **Rate limiting** — 100 req/10min globally, 10 req/15min on auth endpoints
- **Input validation & sanitization** — express-validator on all write endpoints
- **CORS** — configurable origin whitelist
- **Soft delete** — products are deactivated, not destroyed
- **Role-based access control** — admin vs customer guard on every protected route
- **File type & size validation** — only JPEG/PNG/WebP, max 5MB per image

---

## Error Response Format

```json
{
  "success": false,
  "status": "fail",
  "message": "Error description here"
}
```

| Status Code | Meaning                     |
|-------------|-----------------------------|
| 200         | OK                          |
| 201         | Created                     |
| 400         | Bad Request / Validation    |
| 401         | Unauthorized                |
| 403         | Forbidden                   |
| 404         | Not Found                   |
| 429         | Too Many Requests           |
| 500         | Internal Server Error       |

---

## Seeded Test Accounts

After running `npm run seed`:

| Role     | Email                    | Password       |
|----------|--------------------------|----------------|
| Admin    | admin@ecommerce.com      | Admin@1234     |
| Customer | john@example.com         | Customer@1234  |

---

## Postman Collection

Import `postman-collection.json` into Postman. The collection includes:
- Pre-request scripts that auto-save `accessToken` and `refreshToken` on login
- Auto-capture of `productId` and `orderId` from create responses
- Collection-level variables for base URL and auth tokens
#   E _ C o m m e r c e _ A P I  
 