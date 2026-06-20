# Sunstone Management System

A production-ready, full-stack College Management System. This project seamlessly integrates a React/Vite frontend with a robust Node.js/Express backend to deliver robust role-based access control, real-time analytics, and automated email alerts.

## 🚀 Features

*   **Role-Based Dashboards**: Separated experiences for Admins, Faculty, and Students.
*   **Real-time Analytics**: Built-in `Socket.io` syncing forces Admin and Faculty dashboards to recalculate their charts, averages, and At-Risk Watchlists live the moment an attendance sheet is modified anywhere on campus.
*   **Live Attendance Management**: Faculty can query discrete categories (e.g., Computer Science, MBA) and bulk-mark attendance accurately.
*   **Automated Email Alerts Engine**: 
    *   **Absentee Pings**: Automatically emails students when a professor marks them absent.
    *   **Watchlist Pings**: Instantly emails a warning notice to any student the moment their historical attendance percentage falls below 75%.
    *   **Admin Daily Summaries**: A `node-cron` scheduled task automatically generates and emails a clean HTML-rendered daily snapshot to all active administrators at 6:00 PM.
*   **JWT Security**: Full end-to-end Bearer Token interception and Express middleware protection.

## 💻 Technology Stack

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS & Framer Motion
*   **Components**: Shadcn UI & Lucide React Icons
*   **Data Visualization**: Recharts
*   **State / Network**: Context API / Axios
*   **Real-time**: Socket.io-client

### Backend
*   **Environment**: Node.js / Express
*   **Database**: MongoDB (Mongoose ORM)
*   **Security**: JSON Web Tokens (JWT) & Bcryptjs
*   **Automation**: Nodemailer & Node-cron
*   **Sockets**: Socket.io

## 🛠️ Setup Instructions

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) >= 18.x installed, and a [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) connection string (or run MongoDB locally on port 27017).

### 1. Install Dependencies
You can install dependencies for both backend and frontend by running:
```bash
npm install
```

Alternatively, you can install them separately:
```bash
cd backend
npm install
cd ../frontend
npm install
```

### 2. Configure Environment Variables
In the `backend` folder, create a `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sunstone_attendance
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_digit_app_password
```

In the `frontend` folder, when moving to production, create a `.env.production` file:
```env
VITE_API_URL=https://your-backend-api-url.onrender.com
```

### 3. Start Development Servers
You will need to run the system in parallel across two terminals.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
(By default, the Vite configuration contains a local proxy that will cleanly pass any `/api/*` commands over to your local `localhost:5000` Express server without CORS issues).

## 🌍 Deployment Options

You can view the full production guides mapping exactly how to link this system to the cloud directly inside your workspace's `/deployment_guide.md`.
*   **Frontend**: Recommended deployment via **Vercel** with the root directory set to `frontend`.
*   **Backend**: Recommended deployment via **Render** with the root directory set to `backend`.
*   **Database**: **MongoDB Atlas** Free Tier.

## 🛡️ Sample Demo Credentials

Once the MongoDB is connected, standard mock seeding script can be run (`node seed.js`) to generate:
*   **Admin Access**: `admin@sunstone.edu` 
*   **Faculty Access**: `faculty@sunstone.edu`
*   **Student Access**: `student@sunstone.edu` 
*(The password for all accounts is `password123`)*
#   s u n s t o n e - m a n a g e m e n t - s y s t e m