# Event Tech Rental Bundle Optimizer - One Point Solutions

A full-stack, AI-powered technology rental optimizer for **One Point Solutions**. This application uses a rule-based optimization engine to scale audio-visual equipment lists based on event types, attendee sizes, layouts, and budget limits, checking inventory availability in real-time.

---

## Technical Stack
- **Frontend**: React (v19) + TypeScript + Vite + Tailwind CSS (v4) + Lucide Icons + jsPDF (PDF export)
- **Backend**: Node.js + Express + CORS + JWT + Bcrypt + dotenv
- **Database**: MySQL (relational constraints, junction mappings for real-time availability checks)

---

## Directory Layout
```
event-tech-rental/
├── backend/
│   ├── src/
│   │   ├── config/db.js           # MySQL Pool connection using mysql2/promise
│   │   ├── controllers/           # Auth, Equipment CRUD, Quotes, Bookings, Analytics
│   │   ├── middleware/            # JWT validation and Role check RBAC
│   │   ├── routes/                # Endpoint bindings
│   │   ├── utils/                 # Recommendation engine heuristic math
│   │   └── app.js & server.js     # Express App configurations
│   ├── .env                       # Local configurations
│   ├── .env.example
│   ├── seed.js                    # Database seeder (creates accounts and hardware stock)
│   ├── schema.sql                 # MySQL Table definitions
│   └── package.json
└── frontend/
    ├── src/
    │   ├── assets/
    │   ├── components/            # Sidebar, Navbar, Layout, MetricCard, EquipmentCard
    │   ├── context/               # AuthContext (session, login, register, logout)
    │   ├── pages/                 # Login, Register, Recommendation Optimizer, Quote Details
    │   │   └── Dashboards/        # Customer, Manager, and Admin Dashboards
    │   ├── services/api.ts        # Axios API Client with authorization headers
    │   ├── App.tsx                # Main view router
    │   ├── index.css              # CSS Imports & Custom Styles
    │   └── main.tsx
    ├── vite.config.ts             # Port and Backend Proxy definitions
    ├── tailwind.config.js
    ├── index.html
    └── package.json
```

---

## Setting Up the Database (MySQL)

1. Make sure your local MySQL server (such as XAMPP, WampServer, or direct installation) is running.
2. Open your MySQL client (CLI, phpMyAdmin, or DBeaver) and run the commands inside [backend/schema.sql](file:///c:/Users/jalal/OneDrive/Desktop/Event%20tech%20rental/backend/schema.sql) to create the `event_tech_rental` database and initialize the tables:
   ```sql
   -- Alternatively, run in your CLI:
   mysql -u root -p < backend/schema.sql
   ```
3. Copy/configure the `.env` settings inside the `backend/` folder:
   - Ensure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` match your database instance details.

---

## Seeding the Database

In your terminal, navigate to the `backend/` directory and run the database seeder to establish demo accounts and populate the warehouse catalogue:
```bash
# Install backend dependencies (if not already done)
npm install

# Run database seeder
node seed.js
```
Upon success, you will see `Equipment seeded successfully!` in the logs.

---

## Running the Application

Open two separate terminals:

### 1. Launch the Backend Server
```bash
cd backend
npm run dev
# Server runs on port 5000 (verified by database connection log check)
```

### 2. Launch the React Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs on port 3000 (linked to port 5000 using Vite's API proxy)
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Test Accounts (Pre-Seeded)

| Account Role | Email Address | Password | Clearances / Screens |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@onepoint.com` | `admin123` | Full Access, Revenue Charts, Equipment Utilization rates, Quotes & Bookings Manager |
| **Inventory Manager** | `manager@onepoint.com` | `manager123` | Warehouse stats, Edit equipment details, mark items under maintenance/retired |
| **Customer (Organizer)** | `customer@onepoint.com` | `customer123` | Submit event requirements, get AI recommendations, confirm bookings, download PDF quotes |
