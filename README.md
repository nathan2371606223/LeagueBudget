# League Budget Management System

Two GitHub Pages frontends (editor + visitor) with a Railway-hosted Node/Express + PostgreSQL backend.

## Structure

- `backend/`: Express API, PostgreSQL migrations, JWT auth, transfer processing.
- `frontend-editor/`: React editor site (password protected, Chinese UI).
- `frontend-visitor/`: React visitor site (read-only, adaptive polling).
- `DEPLOYMENT_MANUAL.md`: Step-by-step Windows-first deployment guide.

## Quick Start (dev)

1. Backend: `cd backend && npm install && npm run dev`
2. Editor: `cd frontend-editor && npm install && npm run dev`
3. Visitor: `cd frontend-visitor && npm install && npm run dev`

Set `VITE_API_BASE` in both frontends to your backend URL. Default password: `admin`.

