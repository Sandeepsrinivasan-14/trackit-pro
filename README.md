# TrackIt Pro 🎯

**The complete issue tracking & project management platform for modern engineering teams.**

A full-stack MERN application with role-based access control, Kanban boards, real-time analytics, and a premium dark UI.

---

## Features

- **Kanban Board** — drag-and-drop issue tracking across 5 status columns (Open → In Progress → Testing → Resolved → Closed)
- **Analytics Dashboard** — live stats, SVG donut chart, priority matrix, activity timeline, and top-performer leaderboard
- **Project Management** — category-colored project cards with member avatar stacks, pagination, and full CRUD
- **Team Directory** — role-colored user cards with search and role filter
- **Discussions** — thread-style comment system linked to issues and projects
- **Profile** — hero card with issue stats, breakdown progress bars, and member history
- **Role-Based Access Control** — Admin, Manager, Developer, Tester with permission-aware UI
- **Toast Notifications** — custom-built notification system (success / error / info / warning)
- **Premium Dark UI** — aurora animated backgrounds, glassmorphism navbar, 3D card hover effects

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v7, CSS3 (custom design system) |
| Backend | Node.js, Express 5 |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| HTTP | Axios with interceptors |

---

## Project Structure

```
trackit-pro/
├── frontend/          # React app (Create React App)
│   ├── src/
│   │   ├── components/   # Navbar, Toast, DonutChart
│   │   ├── pages/        # Dashboard, Issues, Projects, Users, Comments, Profile, Login
│   │   ├── context/      # AuthContext
│   │   └── services/     # Axios API client
│   └── public/
└── backend/           # Express REST API
    └── src/
        ├── routes/
        ├── models/
        ├── controllers/
        └── middleware/
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend
```bash
cd backend
npm install
# Create .env with MONGO_URI and JWT_SECRET
npm run dev        # starts on :5000
```

### Frontend
```bash
cd frontend
npm install
npm start          # starts on :3000
```

---

## Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Full access — manage users, all projects, all issues, delete comments |
| **Manager** | Create & manage projects, assign issues |
| **Developer** | View assigned issues, update status, post comments |
| **Tester** | Report issues, update testing status |

---

## Author

**Sandeep Srinivasan**

---

*Built with TrackIt Pro — ship faster, track smarter.*
