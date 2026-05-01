Team Task Manager

This is a full-stack web application built to manage team projects and tasks. It allows admins to create projects, assign tasks, and track progress, while team members can view and update their assigned tasks.



Tech Used

Frontend: React (Vite) + Tailwind CSS
Backend: Node.js + Express
Database: MongoDB (Mongoose)
Authentication: JWT



How the App Works

* Users can register and login
* Admins can create projects and add team members
* Tasks can be assigned to members
* Members can update the status of their tasks (like pending, in-progress, done)
* Dashboard shows tasks and their current status



Project Structure (Basic)

* backend → APIs, database models, authentication logic
* frontend → UI, pages, API calls



Running the Project Locally

1. Backend

Go to backend folder:
cd backend

Install dependencies:
npm install

Start server:
npm run dev

Server runs on:
http://localhost:5000



2. Frontend

Go to frontend folder:
cd frontend

Install dependencies:
npm install

Start frontend:
npm run dev

Runs on:
http://localhost:5173



Environment Variables

Backend (.env)

PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret

Frontend (.env)

VITE_API_URL=http://localhost:5000/api



Main Features

* User authentication (login/signup)
* Role-based access (Admin / Member)
* Project management
* Task assignment and tracking
* Simple dashboard view



Deployment

Backend is deployed on Render
Frontend is deployed on Vercel



Note

This project was built as part of a full-stack assignment to demonstrate API handling, authentication, and role-based access in a real-world scenario.
