# Bitsa-Website-Backend
🔧 Backend – BITSA Website Hackathon
Welcome to the backend service powering the BITSA Website Hackathon project. This backend is designed to provide a secure, scalable, and efficient API layer that connects the frontend with the database and media services. It ensures smooth data flow, authentication, and media management, all optimized for deployment in production environments.

⚙️ Tech Context
Node.js & Express.js – Fast, lightweight server framework for building RESTful APIs

MongoDB Atlas – Cloud-hosted NoSQL database for persistent and scalable storage

Cloudinary – Media management platform for handling image and file uploads

JWT Authentication – Secure token-based authentication for users and sessions

🚀 Functionality
API Endpoints: RESTful routes for frontend integration

Authentication: User login, signup, and session management with JWT

Database Operations: CRUD functionality for MongoDB collections

File Uploads: Cloudinary integration for storing and optimizing images/files

Deployment Ready: Configured for production environments with modular structure

📂 Project Structure
Code
backend/
│── src/
│   ├── config/        # Database and service configurations
│   ├── controllers/   # Business logic for routes
│   ├── models/        # MongoDB schemas
│   ├── routes/        # API endpoints
│   ├── utils/         # Helper functions
│── server.js          # Entry point
│── package.json       # Dependencies & scripts
▶️ Setup & Run
Install dependencies

bash
npm install
Run in development

bash
npm run dev
Start in production

bash
npm start
🌐 Deployment Context
Database hosted on MongoDB Atlas
Backend Hosted In render : https://bitsa-website-backend.onrender.com (May take maximum 50 second, due to the usage of the free package)
Media storage handled by Cloudinary

