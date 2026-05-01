# Team Task Manager

A full-stack web application for managing team projects and tasks with role-based access control.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcrypt

## Project Structure

```
Team_Task_Manager_WebApp/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT protect + adminOnly
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosInstance.js
│   │   │   └── services.js
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   └── Tasks.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── index.html
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm

## Setup & Running Locally

### 1. Backend

```bash
cd backend
# Copy sample env and update values
cp .env .env.local
# Install dependencies
npm install
# Start dev server
npm run dev
```

The backend runs at `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Sample `.env` (Backend)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/team_task_manager
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## Sample `.env` (Frontend)

```env
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints

### Auth
| Method | Endpoint              | Access      |
|--------|-----------------------|-------------|
| POST   | /api/auth/register    | Public      |
| POST   | /api/auth/login       | Public      |
| GET    | /api/auth/me          | Private     |
| GET    | /api/auth/users       | Admin only  |

### Projects
| Method | Endpoint                    | Access      |
|--------|-----------------------------|-------------|
| POST   | /api/projects               | Admin only  |
| GET    | /api/projects               | Private     |
| GET    | /api/projects/:id           | Private     |
| POST   | /api/projects/add-member    | Admin only  |
| DELETE | /api/projects/:id/members/:userId | Admin only |

### Tasks
| Method | Endpoint         | Access      |
|--------|------------------|-------------|
| POST   | /api/tasks       | Admin only  |
| GET    | /api/tasks       | Private     |
| GET    | /api/tasks/stats | Private     |
| GET    | /api/tasks/:id   | Private     |
| PUT    | /api/tasks/:id   | Private*    |
| DELETE | /api/tasks/:id   | Admin only  |

> *Members can only update `status` field

## User Roles

| Feature               | Admin | Member |
|-----------------------|-------|--------|
| Create projects       | ✅    | ❌     |
| Add members           | ✅    | ❌     |
| Create tasks          | ✅    | ❌     |
| View own projects     | ✅    | ✅     |
| Update task status    | ✅    | ✅     |
| Delete tasks          | ✅    | ❌     |

## License

MIT
