# Placement App

A full-stack placement management app for students and admins. Students can register, log in, manage profiles, semesters, and resume links. Admins can view departments, filter students by year and department, preview resumes, and manage student records.

## Features

- Student
  - Register and login (register number: exactly 12 digits)
  - Edit profile, academic details, links (resume, portfolio, LinkedIn, GitHub)
  - Resume preview and download
- Admin
  - Admin login
  - Dashboard by year and department
  - Student list with real-time search (by name or register number)
  - Student details: profile, semester view, resume preview and download
  - Delete student

## Recent Improvements

- Robust resume download (handles Google Drive links, sensible filenames)
- Mobile-friendly admin navigation and layouts (sticky/horizontal scroll, tighter spacing)
- Consistent button styles across admin pages
- Register/Login/Admin Login pages:
  - Unified heading design and link hover colors
  - Register page uses dedicated styling with dark theme
  - Dropdowns styled to match inputs; placeholder shows muted color
  - Register number validation: only digits, exactly 12 (Register and Login)
  - Mobile tuning: smaller input boxes on Register, improved spacing
- Removed gradient seam line artifact on auth cards

## Tech Stack

- Frontend: React, TypeScript, React Router, Vite, CSS
- Backend: Node.js, Express (API)
- Auth: Token-based (localStorage)

## Getting Started

1. Clone
   ```bash
   git clone https://github.com/your-username/placement-app.git
   cd placement-app
   ```

2. Install
   ```bash
   npm install
   ```

3. Environment
   - Client `.env` example:
     ```
     VITE_API_BASE_URL=http://localhost:5173
     ```
   - Server `.env` example:
     ```
     PORT=3000
     JWT_SECRET=your_secret
     MONGO_URI=mongodb+srv://...
     ```

4. Run
   - Client:
     ```bash
     npm run dev
     ```
   - Server:
     ```bash
     npm run server
     ```

5. Build
   ```bash
   npm run build
   ```

## Key Paths (Code Map)

- Client
  - Entry and routes
    - `client/src/main.tsx`
    - `client/src/components/ProtectedRoute.tsx`
  - Pages (Student)
    - `client/src/pages/Login.tsx`
    - `client/src/pages/Register.tsx`
    - `client/src/pages/Profile.tsx`
    - `client/src/pages/Semester.tsx`
    - `client/src/pages/Resume.tsx`
  - Pages (Admin)
    - `client/src/pages/admin/AdminLogin.tsx`
    - `client/src/pages/admin/Dashboard.tsx`
    - `client/src/pages/admin/Departments.tsx`
    - `client/src/pages/admin/StudentList.tsx`
    - `client/src/pages/admin/StudentDetails.tsx`
  - Styles
    - `client/src/styles/legacy-login.css`
    - `client/src/styles/register.css`
  - API helper
    - `client/src/lib/api.ts` (base Axios instance or fetch wrapper)

- Server
  - `server/index.js` or `server/app.js` (server bootstrap)
  - `server/routes/*.js` (Express routes)
  - `server/controllers/*.js` (route handlers)
  - `server/models/*.js` (DB models)
  - `server/middleware/*.js` (auth, errors)

## Usage Notes

- Register Number must be exactly 12 digits
  - Inputs sanitize non-digits live; pattern enforces 12 digits on submit
- Admin pages optimized for mobile:
  - Sidebar turns into horizontally scrollable tabs on small screens
  - Sticky sidebar only on large screens
- Resume download:
  - Supports direct and Google Drive links
  - Falls back to opening a new tab if blob download is blocked by CORS

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you’d like to change.

## License

MIT License. See LICENSE for details.

## Copyright

Copyright © 2025 Nithishwaran. All rights reserved.
