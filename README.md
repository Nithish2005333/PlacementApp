
# 📌 Placement App  

A **full-stack monorepo** for managing student placements.  
- **Backend:** Express.js + MongoDB (Mongoose)  
- **Frontend:** React (Vite) + Tailwind CSS  
- **Deployment:** Single Render web service – Express statically serves the built React client.  

---

## 📂 Project Structure
```bash
Placement/
├─ server/                # Backend
│  ├─ index.js            # Express entrypoint
│  ├─ lib/db.js           # MongoDB connection
│  ├─ middleware/auth.js  # JWT middleware
│  ├─ models/             # Student, Admin schemas
│  └─ routes/             # /auth, /students, /admin
│
├─ client/                # Frontend (Vite + React + Tailwind)
│  ├─ index.html
│  ├─ vite.config.ts
│  ├─ tailwind.config.js
│  └─ src/
│     ├─ lib/api.ts       # Axios wrapper with JWT
│     ├─ pages/           # React pages (student/admin)
│     └─ main.tsx         # Router setup
│
├─ package.json           # Root scripts
├─ Procfile               # Render process definition
└─ CSS/, *.html           # Legacy static pages (optional)
````

---

## ⚡ Prerequisites

* **Node.js** ≥ 18
* **MongoDB Atlas URI**

---

## 🔑 Environment Variables

Create a `.env` file in the repo root:

```env
PORT=10000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.yqzgkin.mongodb.net/placement?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=change_me
CLIENT_ORIGIN=http://localhost:5173
```

---

## 🚀 Run Locally (Development)

Install dependencies:

```bash
npm install
```

Run **frontend** (Vite, port `5173`):

```bash
npm run client:dev
```

Run **backend** (Express, port `10000`):

```bash
npm run dev
```

> Vite dev server proxies API requests from `/api` → `http://localhost:10000`.

Seed an admin (optional):

```http
POST http://localhost:10000/api/auth/admin/seed
```

---

## 📦 Build & Serve (Production-like)

```bash
npm run build   # builds frontend into client/dist
npm start       # starts Express, serves built client
```

Now open: **[http://localhost:10000](http://localhost:10000)**

---

## 🌐 Deploy on Render

1. Create a **Web Service** from this repo.
2. Configure:

   * **Build command:**

     ```bash
     npm install
     ```
   * **Start command:**

     ```bash
     node server/index.js
     ```
   * **Environment variables:** `PORT`, `MONGODB_URI`, `JWT_SECRET`.

Express will serve the React build automatically.

---

## 📱 Responsive Notes

* React app: Tailwind responsive utilities.
* Legacy static pages: `CSS/login.css` includes mobile tweaks with

  ```css
  @media (max-width: 480px) { ... }
  ```

---

## 📡 API Endpoints (Summary)

### Student

* `POST /api/auth/student/register`
* `POST /api/auth/student/login`
* `GET /api/students/me`
* `PUT /api/students/me`

### Admin

* `POST /api/auth/admin/login`
* `GET /api/auth/admin/years`
* `GET /api/auth/admin/departments`
* `GET /api/students?year=&department=`
* `GET /api/students/:id`
* `PUT /api/students/:id`

---

## 🛠️ Common Issues

* API calls failing in dev → ensure backend is on `:10000` and proxy is set in `client/vite.config.ts`.
* CORS issues → check `CLIENT_ORIGIN` matches your frontend dev URL.

---

## 📖 License

Nithishwaran © 2025 Placement App Contributors

```


