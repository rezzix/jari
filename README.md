You are a senior full-stack engineer. Help me design and implement a production-ready internal web application similar to Jira, with time tracking features similar to tempo (but simplified) and with a built-in documentation system (but simplified).

## Goal
Build an internal project management system with:
- Issue tracking (Jira-like)
- Time tracking (Tempo-like)
- Project documentation (wiki-style, Confluence-like but minimal)

---

## Core Constraints
- Single organization (no multi-tenancy)
- No public signup (users are managed by admins via backoffice)
- Session-based authentication (Spring Security)
- REST API only (no GraphQL)
- API contract testing via Postman/Newman (no unit tests)
- Keep the documentation system simple (no versioning)

---

## Core Features

### 1. User & Access Management
- Admin-created users (CRUD from backoffice)
- Roles: Admin, Manager, Contributor
- Session-based authentication
- Role-based access control

---

### 2. Project Management
- Programs with :
  - Name, key, description
  - Program manager 
- Projects with:
  - Name, key, description
  - Project manager
- Members assigned to projects 

---

### 3. Issue / Ticket System
- Fields:
  - Title, description (rich text)
  - Status (To Do, In Progress, Done, Custom)
  - Priority
  - Assignee
  - Labels
  - Type (project management, tech lead, architecture, development, data analysis, testing))
- Comments

---

### 4. Kanban Board
- Drag-and-drop between columns (status-based)
- Column configuration per project

---

### 5. Sprint / Backlog
- Backlog view
- Create and manage sprints
- Assign issues to sprints

---

### 6. Time Tracking (Tempo-like)
- Log work on issues (hours, date, description)
- Timesheets (daily/weekly views per user)
- Reporting:
  - Time spent per project
  - Time spent per user
  - Time spent per issue
- Ability to edit/delete logs (with permissions)

---

### 7. Project Documentation (Wiki Feature)

Each project includes a documentation section similar to Confluence.

#### Features:
- Create, edit, and delete documentation pages
- Pages belong to a project
- Nested pages (tree structure using parent-child relationship)
- Rich text content (Markdown)
- Sidebar navigation with page tree
- Search pages by title/content
- Link documentation pages to issues

#### Important Constraints:
- No versioning (only store latest content)
- Keep structure simple and performant

---

### 8. Search & Filters
- Filter issues by:
  - Status, assignee, project, labels, date range

---

### Backend
- Java 21, Spring Boot 3
- Spring Security (session-based auth)
- JPA / Hibernate
- Database: H2 Database (File-based) for portability and rapid prototyping.(will be changed to postgres in production)

### Frontend
- React + TypeScript
- State management with zustand
- Tailwind CSS

### Repo and build tool
- Manage both modules within one monorepo.
- Use Gradle to build the backend and frontend

---

## Requirements
- Clean, modular architecture (Controller / Service / Repository)
- Proper relational database design
- DTO pattern (do not expose entities directly)
- Input validation and error handling
- Audit logging for issues and time tracking

---

## Deliverables (step-by-step)

1. High-level system architecture
2. Database schema design including:
3. Entity relationships
4. REST API design:
   - Auth endpoints
   - Issue endpoints
   - Time tracking endpoints
   - Documentation (wiki) endpoints
5. Backend structure (packages and layers)
6. Admin interface to create users and programs and manage general config (organizition name, address, issue types ...), only the user admin can enter this page.
7. Authentication with landing page, assigned projects and tasks and profile management
8. Interface for manager view to create and edit projects, contributors and issues
9. Interface for contributor to log time on worked issues
10. Documentation module
11. Kanban board (drag-and-drop)
12. Timesheet UI
13. Basic reporting

---

## Constraints for Code
- Production-quality code (not simplified demos)
- Follow Spring Boot best practices
- Avoid overengineering
- Keep documentation module simple

---

## Interaction Rules
- Ask clarifying questions until you're confident that the context is well understood
- Proceed step by step and give me opportunity to test
- Generate only a set of artifacts that makes the project advance one step and let me validate it


