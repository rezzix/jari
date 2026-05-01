# Jari

A Jira-like project management system with time tracking and built-in project documentation.

## Features

- **Issue Tracking** — Create, assign, and manage issues with priorities, labels, types, and statuses
- **Kanban Board** — Drag-and-drop issue cards between status columns
- **Time Tracking** — Log hours against issues, weekly timesheet view, time reports
- **Project Documentation** — Wiki-style pages with nested tree structure and search
- **Sprint Management** — Backlog view, sprint creation, issue assignment to sprints
- **Admin Panel** — User management, programs, organization config, issue types/statuses
- **Multi-Company Support** — Projects and users belong to companies or are global; company-scoped visibility
- **Role-Based Access** — Admin, Manager, Executive, and Contributor roles with appropriate permissions

## Tech Stack

**Backend:** Java 21, Spring Boot 3, Spring Security (session-based auth), JPA/Hibernate, H2 Database

**Frontend:** React 18, TypeScript, Zustand, Tailwind CSS v4, Vite, React Router v6

**Build:** Gradle (monorepo)

## Project Structure

```
jari/
├── backend/                   # Spring Boot application
│   └── src/main/java/com/jari/
│       ├── attachment/         # File attachments
│       ├── common/             # Audit, DTOs, exceptions, storage
│       ├── config/             # Issue types/statuses, org config, data seeder
│       ├── documentation/     # Wiki pages
│       ├── issue/             # Issues, comments
│       ├── program/           # Programs (portfolios)
│       ├── project/           # Projects, members, labels, board columns
│       ├── security/          # Auth, Spring Security config
│       ├── sprint/            # Sprints, backlog
│       ├── timetracking/      # Time logs, timesheets, reports
│       └── user/              # Users
├── frontend/                  # React application
│   └── src/
│       ├── api/               # API client modules
│       ├── components/        # Layout, guards, common components
│       ├── hooks/             # Custom React hooks
│       ├── pages/             # Page components
│       ├── stores/            # Zustand stores
│       ├── types/             # TypeScript type definitions
│       └── utils/             # Formatting utilities
├── docs/                      # Architecture and API documentation
└── postman/                   # API test collection
```

## Getting Started

### Prerequisites

- Java 21+
- Node.js 18+
- Gradle (via wrapper)

### Backend

```bash
./gradlew :backend:bootRun
```

The backend starts at `http://localhost:8080` with an H2 console at `/h2-console`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:5173` and proxies API calls to the backend.

### Default Users

The data seeder creates these test accounts (all passwords: `password123`):

| Username | Role | Company |
|----------|------|---------|
| admin | ADMIN | Global |
| cto | EXECUTIVE | Global |
| sarah | MANAGER | Acme Corp |
| alex | CONTRIBUTOR | Acme Corp |
| maria | CONTRIBUTOR | Acme Corp |
| diana | MANAGER | Global Corp |
| james | CONTRIBUTOR | Global Corp |
| lee | CONTRIBUTOR | Global Corp |

## API Overview

| Resource | Base Path |
|----------|-----------|
| Auth | `/api/auth/*` |
| Users | `/api/users` |
| Companies | `/api/companies` |
| Programs | `/api/programs` |
| Projects | `/api/projects` |
| Issues | `/api/projects/{projectId}/issues` |
| Comments | `/api/projects/{projectId}/issues/{issueId}/comments` |
| Wiki Pages | `/api/projects/{projectId}/wiki/pages` |
| Time Logs | `/api/time-logs` |
| Timesheets | `/api/timesheets` |
| Sprints | `/api/projects/{projectId}/sprints` |
| Admin | `/api/admin/*` |

Full API documentation is available in `docs/rest-api.md` and the Postman collection in `postman/`.