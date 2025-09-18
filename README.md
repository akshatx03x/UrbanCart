🛍️ MERN E-Commerce Website

A full-stack e-commerce web application built with the MERN stack (MongoDB, Express, React, Node.js).
Users can browse products, add items to a cart, place orders, and pay securely.

🚀 Features

🔑 User Authentication & Authorization – Sign up, log in, and role-based access (Admin / Customer)

🛒 Product Management – List, search, filter, and paginate products

🧺 Shopping Cart & Checkout – Add/remove items, adjust quantities

💳 Payment Integration – Stripe payment gateway for secure transactions

📦 Order Management – Track order history and status

⚙️ Admin Dashboard – CRUD operations for products, users, and orders

📱 Responsive UI – Mobile-first design

🏗️ Tech Stack

Frontend: React, Redux Toolkit, React Router, TailwindCSS
Backend: Node.js, Express.js
Database: MongoDB (Mongoose)
Authentication: JWT + bcrypt
Payments: Stripe
Deployment: Vercel (frontend) & Render (backend)

📂 Project Structure
root
 ├── client/       # React frontend
 ├── server/       # Express backend
 ├── .env          # Environment variables (never commit!)
 ├── package.json
 └── README.md

⚙️ Installation & Setup
Prerequisites

Node.js v18+

MongoDB (local installation or Atlas cluster)

1️⃣ Clone the repository
git clone https://github.com/your-username/mern-ecommerce.git
cd mern-ecommerce

2️⃣ Install dependencies
# Install server dependencies
npm install
# Install client dependencies
cd client
npm install

3️⃣ Environment variables

Create a .env file inside server/:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret

4️⃣ Run in development
# From project root, in one terminal
npm run server     # backend on http://localhost:5000
# In another terminal
cd client && npm start  # frontend on http://localhost:3000

5️⃣ Production build
cd client
npm run build


Serve the build folder through the backend or a static host.

🧪 Testing

If you add tests with Jest/React Testing Library:

npm test

📸 Screenshots
Home Page	Product Page	Cart

	
	

(Add actual images inside a screenshots/ folder and update paths.)

🛡️ Security Notes

Do not commit .env or secret keys.

Use HTTPS and strong JWT secrets in production.
