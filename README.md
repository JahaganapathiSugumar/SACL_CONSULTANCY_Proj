# SACL_CONSULTANCY_Proj

A web-based Trial Card Management system for manufacturing quality and trial processes. The repository contains a TypeScript/React frontend (Vite) and a Node.js/Express backend that uses Microsoft SQL Server for persistence. Features include user authentication (JWT), trial card lifecycle management, department-driven workflows, inspection and correction records, document uploads, audit logging, and application logging with rotation.

Live demo / homepage: https://digitaltrialcard-sakthiauto.vercel.app
Repository: https://github.com/JahaganapathiSugumar/SACL_CONSULTANCY_Proj

---

## Table of contents

- Project overview
- Key features
- Tech stack
- Project structure
- Setup & run (developer)
  - Prerequisites
  - Server
  - Client
- Environment variables
- Important scripts
- API surface (summary)
- Database notes
- Logging

---

## Project overview

This project manages trial cards and their progress across departments. It stores trial metadata, sand/material properties, visual/dimensional/metallurgical inspections, mould and material corrections, machine shop data, documents, and audit logs. The backend exposes REST endpoints secured with JWT; the frontend is a React + TypeScript app bootstrapped with Vite.

The backend is implemented using ES modules (type: "module") and includes transaction-safe DB operations and audit logging for important actions.

---

## Key features

- Create/read/update trial cards and their lifecycle status
- Departmental workflow and progress updates
- Visual inspection, dimensional/metallurgical inspection, sand properties, material correction, mould correction, pouring details
- Document upload (stored as Base64 in the DB) and retrieval
- User authentication with JWT and refresh tokens
- Audit logging for user actions
- Application logging with Winston + daily rotation
- Health and IP endpoints for basic monitoring

---

## Tech stack

- Frontend
  - React 18, TypeScript
  - Vite
  - Material UI (MUI)
  - axios for API calls
- **Backend**
  - Node.js (ES modules)
  - Express 5.x
  - MSSQL (mssql package)
  - JWT for authentication
  - bcrypt for password hashing
  - nodemailer / resend for emails
  - winston + winston-daily-rotate-file for logging
- Database: Microsoft SQL Server

---

## Project structure (top-level)

- client/ — React + Vite frontend (TypeScript)
  - .env (VITE_API_BASE)
  - package.json (dev & build scripts)
- server/ — Node/Express backend
  - package.json (start / dev)
  - src/
    - index.js — Express app and route mounting
    - config/
      - connection.js — mssql connection pool + transaction helper
      - logger.js — winston logger + daily rotate files
    - controllers/ — route handlers (trial, documents, login, sandProperties, materialCorrection, departments, etc.)
    - routes/ — Express routers (masterList, visualInspection, etc.)
    - middlewares/ — (verifyToken, authorizeRoles, authorizeDepartments) — used by routes
    - services/ — domain services (department progress, trial status updates, etc.)
    - utils/ — helpers (customError, asyncErrorHandler, getClientIp)
- logs/ — generated at runtime (combined, error, etc.)
- README.md — this file

---

## Setup & run

Prerequisites
- Node.js (recommend v18+)
- npm or yarn
- Microsoft SQL Server (accessible from the server process)
- Environment variables configured (see below)

Server (backend)
1. cd server
2. npm install
3. Create a `.env` file in `server/` with required variables (see Environment variables below).
4. Development:
   - npm run dev (nodemon)
5. Production:
   - npm start

Client (frontend)
1. cd client
2. npm install
3. Update `client/.env` VITE_API_BASE if needed (defaults to `http://localhost:3000/api`)
4. Development:
   - npm run dev
5. Build:
   - npm run build
6. Preview production build:
   - npm run preview

Notes
- The backend listens to API routes under `/api/...`. The client expects an API base URL in `VITE_API_BASE`.
- Ensure CORS origin in the server configuration matches your client's origin.

---

## Environment variables

At minimum, the server requires database and JWT-related environment variables. Example (server/.env):

- DB_USER — database username
- DB_PASSWORD — database password
- DB_SERVER — database host (e.g., localhost or server address)
- DB_DATABASE — database name
- JWT_SECRET — secret used for JWT signing
- REFRESH_TOKEN_SECRET — secret used for refresh tokens
- DEFAULT_PASSWORD — used to detect default password enforcement (optional)
- NODE_ENV — development | production

Client `.env`:
- VITE_API_BASE — base URL for API requests (e.g., http://localhost:3000/api)

The SQL connection in `server/src/config/connection.js` sets `encrypt: true` and `trustServerCertificate: true` — adapt these for your environment (especially when using production SQL Server).

---

## Important scripts

server/package.json
- start: node src/index.js
- dev: nodemon src/index.js

client/package.json
- dev: vite
- build: tsc -b && vite build
- preview: vite preview
- lint: eslint .

---

## API summary (routes mounted in server/src/index.js)

All routes are prefixed with `/api` in the server:

- /api/master-list — Master list endpoints (get, search, create, update, toggle status, bulk delete)
- /api/users — User management (create/update/list, requires auth)
- /api/login — Authentication (login returns token and refresh token)
- /api/departments — Department list
- /api/trial — Trial card endpoints (create, get, get by id, etc.)
- /api/department-progress — Department progress utilities
- /api/visual-inspection — Create, update, list visual inspections
- /api/material-correction — Material correction create/update
- /api/sand-properties — Sand properties create/update
- /api/pouring-details — pouring related endpoints
- /api/moulding-correction — mould correction endpoints
- /api/dimensional-inspection — dimensional inspection endpoints
- /api/metallurgical-inspection — metallurgical inspection endpoints
- /api/machine-shop — machine shop related endpoints
- /api/documents — Document upload and retrieval
- /api/stats — Statistics endpoints
- /api/forgot-password — Password reset flow

Authentication
- Many routes require JWT verification middleware (`verifyToken`).
- Role/department-level checks exist (`authorizeRoles`, `authorizeDepartments`).

Document uploads
- Documents are uploaded via a JSON body with `file_base64` and metadata — the backend stores base64 data and metadata in the `documents` table.

Example: POST /api/documents
Body: { trial_id, document_type, file_name, file_base64, remarks }

---

## Database notes

- The project uses Microsoft SQL Server as the target database.
- The connection pool and transaction helpers are provided in `server/src/config/connection.js`.
- Queries insert audit logs into an `audit_log` table for user actions.
- Many transactional operations are wrapped using the `client.transaction` helper to ensure consistency (create trial, create sand properties, create material correction, etc.).

---

## Logging

- Application logging is implemented with `winston` and `winston-daily-rotate-file` in `server/src/config/logger.js`.
- Logs are written to console (development) and rotated files:
  - logs/combined/app-%DATE%.log
  - logs/error/error-%DATE%.log
- The server will create required log directories at startup if they don't exist.

---

## Development & testing notes

- Linters and type tools exist in the client (ESLint, TypeScript).
- Ensure that default passwords and secrets are changed before deploying to production.
- Consider moving from storing file content in the DB to cloud/object storage for large files.

---

```
