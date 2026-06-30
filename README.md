# MediConsensus – Collaborative Medical Diagnostics Platform (Next.js 15 + Express + MongoDB)

This is the enterprise-grade rewrite of the **MediConsensus** platform, decoupled into a modern Next.js 15 Client app and an Express.js REST API server with MongoDB persistence and OpenRouter AI integrations.

---

## 1. Directory Structure

```text
├── backend/
│   ├── config/             # Cloudinary, Mongoose database configs
│   ├── controllers/        # Express request routers for authentication, report analysis, overrides, analytics
│   ├── middleware/         # Token validation and rate limiting
│   ├── models/             # Patient details, AI results, and Consensus reports Schemas
│   ├── routes/             # REST Endpoints mapping
│   ├── tests/              # End-to-end integration tests script
│   ├── utils/              # OpenRouter AI query wrapper & Mock Fallback databases
│   ├── server.js           # Server Bootstrap Entrypoint
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/            # Next.js 15 client layout, landing page, login triggers, and diagnose panels
    │   ├── components/     # UI elements, Accordions, Form inputs (Tailwind and glass layouts)
    │   ├── hooks/          # Zustand State hook for user auth
    │   ├── types/          # Strict TypeScript interface declarations
    │   └── globals.css     # CSS Styling variables
    ├── tsconfig.json
    ├── tailwind.config.ts
    └── package.json
```

---

## 2. Installation and Local Setup

Ensure you have **Node.js v18+** installed. You will need to spin up the Backend server and Frontend app in parallel.

### A. Clone and Setup Environment
1.  Clone this repository to your workspace.
2.  Review/Create `backend/.env` based on `backend/.env.example`.
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/mediconsensus
    JWT_SECRET=mediconsensus_secret
    OPENROUTER_API_KEY=your_key_here  # Fallback mocks are enabled if key is empty
    ```

### B. Launch Mongoose Backend Database Server
1.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Seed the database** (Creates default practitioner credentials, patient logs, and audit logs):
    ```bash
    npm run seed
    ```
4.  Start development server:
    ```bash
    npm run dev
    ```
    The API console will boot at `http://localhost:5000`.

### C. Launch Next.js 15 Client
1.  Open another terminal window and navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start dev client:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to `http://localhost:3000`.

---

## 3. Login Sandbox Credentials
After running the seeder, you can log in using these preset credentials:
*   **Email**: `drsmith@mediconsensus.com`
*   **Password**: `password123`

---

## 4. Run API Tests
Verify backend API configurations:
1.  In the `backend` folder, run:
    ```bash
    node tests/api.test.js
    ```
