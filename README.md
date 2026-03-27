# HR Dashboard — Full-Stack Monorepo

A production-ready HR attendance system with:
- **Backend**: Node.js + Express + Supabase
- **Web Admin**: React Dashboard
- **Android App**: Kotlin
- **iOS App**: Swift

---

## 📁 Project Structure

```
HRDASHBOARD/
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── config/           # Supabase client, logger
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── routes/           # Express routers
│   │   ├── services/         # Business logic
│   │   └── index.js          # App entry point
│   └── supabase_migration.sql
├── webapp/                   # React Admin Dashboard
│   └── src/
│       ├── components/       # Layout, Sidebar, ProtectedRoute
│       ├── context/          # AuthContext
│       ├── pages/            # Dashboard, Employees, Attendance, Campaigns, Salary
│       └── services/         # Axios API client
├── android-app/              # Kotlin Android App
│   └── app/src/main/
│       ├── java/com/hrapp/
│       │   ├── data/         # Models, ApiService, RetrofitClient
│       │   ├── ui/           # Activities, Adapters
│       │   └── viewmodel/    # MainViewModel
│       └── res/layout/       # XML layouts
└── ios-app/                  # Swift iOS App
    └── HRApp/
        ├── Models/           # Data models
        ├── Services/         # APIService, LocationManager
        ├── ViewModels/       # AuthViewModel, AttendanceViewModel
        └── Views/            # SwiftUI views
```

---

## 🚀 Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Go to **SQL Editor** → paste contents of `backend/supabase_migration.sql` → Run
3. Go to **Authentication → Users** → Create your first admin user
4. In **SQL Editor**, run:
   ```sql
   INSERT INTO public.users (id, name, email, role)
   VALUES ('<auth-user-uuid>', 'Admin Name', 'admin@example.com', 'admin');
   ```
5. Copy your **Project URL**, **anon key**, and **service_role key** from Settings → API

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your Supabase credentials in .env
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

---

### 3. Web Admin Setup

```bash
cd webapp
cp .env.example .env
# Fill in REACT_APP_API_URL, REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY
# Get a Google Maps API key from console.cloud.google.com
npm install
npm start
```

Dashboard runs on `http://localhost:3000`

---

### 4. Android App Setup

1. Open `android-app/` in **Android Studio**
2. In `app/build.gradle`, update `BASE_URL` to your backend URL
   - For emulator: `http://10.0.2.2:5000/api`
   - For physical device: `http://<your-local-ip>:5000/api`
3. Click **Run**

---

### 5. iOS App Setup

1. Open `ios-app/HRApp/` in **Xcode**
2. Update `BASE_URL` in `Resources/Info.plist`
3. Set your Team in Signing & Capabilities
4. Run on simulator or device

---

## 🌐 Deployment

### Backend → Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
# Set environment variables in Railway dashboard
```

### Webapp → Vercel

```bash
npm install -g vercel
cd webapp
vercel --prod
# Set environment variables in Vercel dashboard
```

---

## 📡 API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | No | Login with email/password |
| GET | `/auth/me` | Yes | Get current user profile |

**POST /auth/login**
```json
// Request
{ "email": "admin@example.com", "password": "password123" }

// Response
{ "token": "eyJ...", "user": { "id": "uuid", "name": "Admin", "email": "...", "role": "admin" } }
```

---

### Attendance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/attendance/punch-in` | Yes | Punch in with GPS |
| POST | `/attendance/punch-out` | Yes | Punch out with GPS |
| GET | `/attendance` | Yes | Get logs (admin: all, employee: own) |

**POST /attendance/punch-in**
```json
// Request
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "device_info": { "deviceName": "Pixel 7", "os": "Android 14", "deviceId": "abc123" }
}
```

**GET /attendance?date=2024-01-15&userId=uuid&page=1&limit=20**

---

### Users (Admin only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Admin | List all employees |
| POST | `/users` | Admin | Create new employee |

**POST /users**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "pass123" }
```

---

### Campaigns (Admin only for write)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/campaigns` | Yes | List all campaigns |
| POST | `/campaigns` | Admin | Create campaign |
| PUT | `/campaigns/:id` | Admin | Update campaign |
| DELETE | `/campaigns/:id` | Admin | Delete campaign |
| POST | `/campaigns/:id/assign` | Admin | Assign employee |
| DELETE | `/campaigns/:id/assign/:userId` | Admin | Remove employee |

---

### Salary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/salary` | Yes | Get payslips (admin: all, employee: own) |
| POST | `/salary/generate` | Admin | Generate payslip |

**POST /salary/generate**
```json
{
  "userId": "uuid",
  "month": "2024-01",
  "per_day_pay": 1500,
  "deductions": 500
}
```

---

## 🔐 Security Notes

- Backend uses Supabase **service role key** (server-side only, never expose to client)
- All JWT tokens validated via Supabase Auth on every request
- Admin routes protected by role check middleware
- Input validation on all POST/PUT endpoints via express-validator
- CORS enabled (restrict origins in production)

---

## 🗄️ Database Schema

```
users              → id, name, email, role, created_at
attendance_logs    → id, user_id, punch_in/out_time, lat/lng, device_info
campaigns          → id, name, description, created_at
campaign_assignments → id, user_id, campaign_id (unique pair)
salaries           → id, user_id, month, total_days, per_day_pay, deductions, total_salary
```
