# Smart Leads Dashboard 🚀

A full-stack MERN Smart Leads Dashboard built using React, TypeScript, Node.js, Express, MongoDB Atlas, Redux Toolkit, JWT Authentication, and Docker.

This project helps manage leads efficiently with authentication, CRUD operations, filtering, pagination, dark mode, CSV export, and Dockerized deployment.

---

# 📌 Features

## 🔐 Authentication
- User Registration
- User Login
- JWT Authentication
- Protected Routes

## 📊 Dashboard
- View Leads
- Add New Leads
- Edit Leads
- Delete Leads
- Search Leads
- Filter by Status
- Filter by Source
- Pagination
- Dark Mode Toggle
- Export Leads to CSV

## 🐳 Docker Support
- Dockerized Frontend
- Dockerized Backend
- Docker Compose Setup

---

# 🛠️ Tech Stack

## Frontend
- React.js
- TypeScript
- Redux Toolkit
- Axios
- CSS

## Backend
- Node.js
- Express.js
- TypeScript
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcryptjs

## DevOps
- Docker
- Docker Compose

---

# 📂 Project Structure

```bash
smart-leads-dashboard/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── server/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
└── README.md
````

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/pritt18/smart-leads-dashboard.git
```

```bash
cd smart-leads-dashboard
```

---

# 🔧 Backend Setup

```bash
cd server
npm install
```

Create `.env` file inside `server` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Run backend:

```bash
npm run dev
```

---

# 💻 Frontend Setup

```bash
cd client
npm install
```

Run frontend:

```bash
npm run dev
```

---

# 🐳 Docker Setup

Run full application using Docker:

```bash
docker compose up --build
```

Frontend:

```bash
http://localhost:5173
```

Backend:

```bash
http://localhost:5000
```

---

# 🔑 API Routes

## Authentication

| Method | Endpoint           |
| ------ | ------------------ |
| POST   | /api/auth/register |
| POST   | /api/auth/login    |

## Leads

| Method | Endpoint       |
| ------ | -------------- |
| GET    | /api/leads     |
| POST   | /api/leads     |
| PUT    | /api/leads/:id |
| DELETE | /api/leads/:id |

---

# 📸 Screenshots

## Login Page

(Add Screenshot Here)

## Dashboard

(Add Screenshot Here)

## Dark Mode

(Add Screenshot Here)

---

# 🚀 Deployment

## Frontend Deployment

* Vercel

## Backend Deployment

* Render

---

# 👨‍💻 Author

## Pritam Gangurde

* GitHub: [https://github.com/pritt18](https://github.com/pritt18)
* LinkedIn: [https://www.linkedin.com/in/pritam-gangurde-b51528249](https://www.linkedin.com/in/pritam-gangurde-b51528249)

---

# ⭐ Future Improvements

* Role-Based Access
* AI Lead Scoring
* Email Integration
* Analytics Dashboard
* Notifications
* Charts & Graphs

---
