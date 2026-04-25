# Jari — Database Schema Design

## Entity-Relationship Diagram (Textual)

```
OrganizationConfig (singleton)
       │
       ├──1:N──► IssueType
       ├──1:N──► IssueStatus
       │
User ──1:N──► Program (as manager)
  │    1:N──► Project (as manager)
  │    1:N──► Issue (as assignee/reporter)
  │    1:N──► TimeLog
  │    1:N──► Comment
  │    1:N──► WikiPage (as author)
  │    1:N──► Attachment (as uploader)
  │    M:N──► Project (as member, via ProjectMember)
  │
Program ──1:N──► Project
Project ──1:N──► Issue
         1:N──► Label
         1:N──► Sprint
         1:N──► BoardColumn
         1:N──► WikiPage
         M:N──► User (via ProjectMember)
Issue ──1:N──► Comment
      ──1:N──► Attachment
      ──1:N──► TimeLog
      ──1:N──► WikiPageIssueLink
      ──M:N──► Label (via IssueLabel)
      ──N:1──► Sprint (nullable)
WikiPage ──1:N──► WikiPage (self-referencing parent)
```

---

## Tables

### 1. organization_config

Singleton table (single row) holding organization-wide settings managed by the admin.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(255) | NOT NULL | Organization name |
| address | TEXT | | Organization address |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

---

### 2. user

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| username | VARCHAR(100) | NOT NULL, UNIQUE | Login identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | |
| password_hash | VARCHAR(255) | NOT NULL | BCrypt hash |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| role | VARCHAR(20) | NOT NULL, CHECK IN ('ADMIN','MANAGER','CONTRIBUTOR') | |
| avatar_url | VARCHAR(500) | | Optional profile picture path |
| active | BOOLEAN | NOT NULL, default true | Soft-disable instead of delete |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_user_username`, `idx_user_email`, `idx_user_role`

---

### 3. program

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(255) | NOT NULL | |
| key | VARCHAR(10) | NOT NULL, UNIQUE | Short identifier (e.g. "PROG1") |
| description | TEXT | | |
| manager_id | BIGINT | FK → user(id), NOT NULL | Program manager |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_program_key`, `idx_program_manager`

---

### 4. project

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(255) | NOT NULL | |
| key | VARCHAR(10) | NOT NULL, UNIQUE | Short identifier (e.g. "JARI") |
| description | TEXT | | |
| program_id | BIGINT | FK → program(id), NOT NULL | Parent program |
| manager_id | BIGINT | FK → user(id), NOT NULL | Project manager |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_project_key`, `idx_project_program`, `idx_project_manager`

---

### 5. project_member

Join table for project ↔ user membership.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| project_id | BIGINT | FK → project(id), NOT NULL | |
| user_id | BIGINT | FK → user(id), NOT NULL | |
| created_at | TIMESTAMP | NOT NULL, default now() | |

**Unique constraint:** `(project_id, user_id)`

**Indexes:** `idx_project_member_user`, `idx_project_member_project`

---

### 6. issue_type

Organization-level issue types, managed by admin.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(100) | NOT NULL | e.g. "Development", "Testing" |

Default seed data: Project Management, Tech Lead, Architecture, Development, Data Analysis, Testing

---

### 7. issue_status

Organization-level statuses, managed by admin.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(100) | NOT NULL | e.g. "To Do", "In Progress" |
| category | VARCHAR(20) | NOT NULL, CHECK IN ('TODO','IN_PROGRESS','DONE') | Groups statuses for board columns |
| is_default | BOOLEAN | NOT NULL, default false | The default status for new issues |

Default seed data: To Do (TODO), In Progress (IN_PROGRESS), Done (DONE)

---

### 8. label

Per-project labels for issue tagging.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(100) | NOT NULL | |
| color | VARCHAR(7) | NOT NULL | Hex color (e.g. "#FF5733") |
| project_id | BIGINT | FK → project(id), NOT NULL | |

**Unique constraint:** `(project_id, name)`

---

### 9. issue

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| title | VARCHAR(500) | NOT NULL | |
| description | TEXT | | Rich text (Markdown) |
| issue_key | VARCHAR(20) | NOT NULL, UNIQUE | Display key (e.g. "JARI-42") |
| status_id | BIGINT | FK → issue_status(id), NOT NULL | |
| priority | VARCHAR(20) | NOT NULL, CHECK IN ('CRITICAL','HIGH','MEDIUM','LOW') | |
| type_id | BIGINT | FK → issue_type(id), NOT NULL | |
| project_id | BIGINT | FK → project(id), NOT NULL | |
| assignee_id | BIGINT | FK → user(id), nullable | Currently assigned user |
| reporter_id | BIGINT | FK → user(id), NOT NULL | Who created the issue |
| sprint_id | BIGINT | FK → sprint(id), nullable | null = in backlog |
| position | INTEGER | NOT NULL, default 0 | Ordering within backlog or sprint |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_issue_project`, `idx_issue_assignee`, `idx_issue_sprint`, `idx_issue_status`, `idx_issue_key`, `idx_issue_position`

---

### 10. issue_label

Join table for issue ↔ label (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| issue_id | BIGINT | FK → issue(id), NOT NULL | |
| label_id | BIGINT | FK → label(id), NOT NULL | |

**Primary key:** `(issue_id, label_id)`

---

### 11. comment

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| content | TEXT | NOT NULL | Rich text (Markdown) |
| issue_id | BIGINT | FK → issue(id), NOT NULL | |
| author_id | BIGINT | FK → user(id), NOT NULL | |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_comment_issue`

---

### 12. attachment

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| file_name | VARCHAR(500) | NOT NULL | Original filename |
| file_path | VARCHAR(1000) | NOT NULL | Storage path (filesystem or S3 key) |
| content_type | VARCHAR(100) | NOT NULL | MIME type |
| file_size | BIGINT | NOT NULL | Size in bytes |
| issue_id | BIGINT | FK → issue(id), NOT NULL | |
| uploaded_by | BIGINT | FK → user(id), NOT NULL | |
| created_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_attachment_issue`

---

### 13. sprint

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(255) | NOT NULL | |
| goal | TEXT | | Sprint goal / objective |
| project_id | BIGINT | FK → project(id), NOT NULL | |
| status | VARCHAR(20) | NOT NULL, CHECK IN ('PLANNING','ACTIVE','CLOSED') | |
| start_date | DATE | | |
| end_date | DATE | | |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_sprint_project`, `idx_sprint_status`

---

### 14. board_column

Per-project Kanban board configuration. Maps which statuses appear as columns and their order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| project_id | BIGINT | FK → project(id), NOT NULL | |
| status_id | BIGINT | FK → issue_status(id), NOT NULL | |
| position | INTEGER | NOT NULL | Column order (0-based) |

**Unique constraint:** `(project_id, status_id)`

---

### 15. time_log

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| hours | DECIMAL(5,2) | NOT NULL | Hours logged (e.g. 2.50) |
| log_date | DATE | NOT NULL | Date the work was performed |
| description | TEXT | | Description of work done |
| issue_id | BIGINT | FK → issue(id), NOT NULL | |
| user_id | BIGINT | FK → user(id), NOT NULL | Who logged the time |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_timelog_issue`, `idx_timelog_user`, `idx_timelog_date`, `idx_timelog_user_date`

---

### 16. wiki_page

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| title | VARCHAR(500) | NOT NULL | |
| content | TEXT | | Markdown content |
| slug | VARCHAR(500) | NOT NULL | URL-friendly identifier |
| project_id | BIGINT | FK → project(id), NOT NULL | |
| parent_id | BIGINT | FK → wiki_page(id), nullable | Self-referencing for tree structure |
| author_id | BIGINT | FK → user(id), NOT NULL | Last editor |
| position | INTEGER | NOT NULL, default 0 | Order among siblings |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Unique constraint:** `(project_id, slug)`

**Indexes:** `idx_wikipage_project`, `idx_wikipage_parent`, `idx_wikipage_author`

---

### 17. wiki_page_issue_link

Join table linking wiki pages to issues.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| wiki_page_id | BIGINT | FK → wiki_page(id), NOT NULL | |
| issue_id | BIGINT | FK → issue(id), NOT NULL | |

**Unique constraint:** `(wiki_page_id, issue_id)`

---

### 18. audit_log

Tracks changes on issues and time logs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| entity_type | VARCHAR(50) | NOT NULL | e.g. "ISSUE", "TIME_LOG" |
| entity_id | BIGINT | NOT NULL | ID of the changed entity |
| action | VARCHAR(20) | NOT NULL | CREATE, UPDATE, DELETE |
| old_value | TEXT | | JSON snapshot before change (null for CREATE) |
| new_value | TEXT | | JSON snapshot after change (null for DELETE) |
| performed_by | BIGINT | FK → user(id), NOT NULL | Who made the change |
| created_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_audit_entity`, `idx_audit_performed_by`, `idx_audit_created_at`

---

## Design Decisions

### Why `issue_key` instead of auto-generated ID only?
Issues get human-readable keys like `JARI-42` (project key + sequential number). This is how users reference issues in conversations and time logs. The key is generated on creation: `{project.key}-{next_sequence}`.

### Why `position` on `issue` instead of a separate ordering table?
Keeps the schema simple. The `position` field determines ordering within the backlog (when `sprint_id` is null) or within a sprint (when `sprint_id` is set). When dragging issues on the board or backlog, the client sends updated position values.

### Why `board_column` as a separate table?
Allows each project to configure which statuses appear on its Kanban board and in what order. A project might only show "To Do → In Progress → Done" while another adds a "Review" column.

### Why `category` on `issue_status`?
Groups statuses into three buckets (TODO, IN_PROGRESS, DONE) so the system knows the semantic meaning regardless of custom names. Useful for reporting and sprint metrics (e.g., counting "done" issues).

### Why `priority` as an enum and not a table?
Priorities are stable and universal (Critical/High/Medium/Low). Unlike statuses and types, they don't need admin customization. A CHECK constraint is sufficient.

### Why `DECIMAL(5,2)` for `time_log.hours`?
Allows values like `2.50` (two and a half hours) with a max of `999.99`. More precise than integer hours, avoids floating-point rounding issues.

### Why `slug` on `wiki_page`?
URL-friendly identifiers for wiki pages (e.g., `/projects/JARI/wiki/getting-started`). Better than exposing internal IDs in URLs and enables search-friendly page addressing.

### Why `is_default` on `issue_status`?
When creating a new issue, the system needs to know which status to assign by default. Exactly one status should have `is_default = true`.

---

## Default Seed Data

On first startup, the application seeds:

| Table | Default Rows |
|-------|-------------|
| organization_config | 1 row (name: "My Organization") |
| issue_type | Project Management, Tech Lead, Architecture, Development, Data Analysis, Testing |
| issue_status | To Do (TODO, is_default), In Progress (IN_PROGRESS), Done (DONE) |

---

## Cascade Delete Rules

| Parent | Child | Rule | Reason |
|--------|-------|------|--------|
| user | project (as manager) | RESTRICT | Can't delete a user who manages a project |
| user | issue (as reporter) | RESTRICT | Can't delete a user who reported issues |
| project | issue | CASCADE | Deleting a project deletes all its issues |
| project | label | CASCADE | Deleting a project deletes its labels |
| project | sprint | CASCADE | Deleting a project deletes its sprints |
| project | wiki_page | CASCADE | Deleting a project deletes its wiki |
| project | board_column | CASCADE | Deleting a project deletes its board config |
| issue | comment | CASCADE | Deleting an issue deletes its comments |
| issue | attachment | CASCADE | Deleting an issue deletes its attachment records (files cleaned up by service) |
| issue | time_log | CASCADE | Deleting an issue deletes its time logs |
| wiki_page | wiki_page (children) | CASCADE | Deleting a parent page deletes all children |
| sprint | issue (sprint_id) | SET NULL | Closing/deleting a sprint moves issues back to backlog |

---

## Indexing Strategy

Indexes are chosen based on the most common query patterns:

- **Issues by project + status** → `idx_issue_project`, `idx_issue_status`
- **Issues by assignee** → `idx_issue_assignee`
- **Issues in a sprint** → `idx_issue_sprint`
- **Time logs by date range** → `idx_timelog_date`, `idx_timelog_user_date`
- **Time logs by user** → `idx_timelog_user`
- **Audit log lookups** → `idx_audit_entity`, `idx_audit_created_at`
- **Wiki pages by project** → `idx_wikipage_project`
- **Comments by issue** → `idx_comment_issue`

Full-text search for wiki pages and issue descriptions will be handled at the application/query level (not via DB full-text indexes), keeping the schema portable between H2 and Postgres.