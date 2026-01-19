# League Budget Management System

Two GitHub Pages frontends (editor + visitor) with a Railway-hosted Node/Express + PostgreSQL backend.

## Structure

- `backend/`: Express API, PostgreSQL migrations, JWT auth, transfer processing.
- `frontend-editor/`: React editor site (password protected, Chinese UI).
- `frontend-visitor/`: React visitor site (read-only, manual refresh).
- `DEPLOYMENT_MANUAL.md`: Step-by-step Windows-first deployment guide.

## Features

### Editor Site
- Password login (shared with other modules)
- Team management:
  - Edit team budget (click to edit)
  - Edit team name (click to edit)
  - **Edit level names** (click level name to edit, affects all displays)
  - **Swap teams** (drag and drop within same level)
- Transfer import:
  - Format: `team_out,team_in,price,player1[,player2][,player3][,player4]`
  - Batch import supported
  - Automatically updates team budgets
- History management:
  - View modification history
  - Clear history
  - Export history as CSV
- **Announcement management**: Set and update announcement content, visible on visitor site
- **Token alerts**: View and manage token mismatch alerts

### Visitor Site
- Read-only view of all teams and budgets
- Grouped by level (with customizable level names)
- Manual refresh button (no auto-refresh)
- Shows modification history
- **Announcement display**: View announcements posted by administrators

## Quick Start (dev)

1. Backend: `cd backend && npm install && npm run dev`
2. Editor: `cd frontend-editor && npm install && npm run dev`
3. Visitor: `cd frontend-visitor && npm install && npm run dev`

Set `VITE_API_BASE` in both frontends to your backend URL. Default password: `admin`.

## Database

Tables with `lb_` prefix:
- `lb_config`: Configuration table (for password)
- `lb_teams`: Teams table
- `lb_modification_history`: Modification history
- `lb_announcement`: Announcement table

Shared tables (used by other modules):
- `lb_team_tokens`: Team tokens table (one token per team)
- `lb_token_alerts`: Token alerts table (records token mismatches)
