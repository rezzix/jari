# Jari — UML Diagrams

All diagrams use [Mermaid](https://mermaid.js.org/) syntax. Render them in GitHub, VS Code (with Mermaid extension), or [mermaid.live](https://mermaid.live).

---

## 1. Domain Model (Class Diagram)

Core entities and their relationships.

```mermaid
classDiagram
    direction LR

    class OrganizationConfig {
        +Long id
        +String name
        +String address
    }

    class User {
        +Long id
        +String username
        +String email
        +String passwordHash
        +String firstName
        +String lastName
        +Role role
        +String avatarUrl
        +boolean active
    }

    class Program {
        +Long id
        +String name
        +String key
        +String description
    }

    class Project {
        +Long id
        +String name
        +String key
        +String description
    }

    class ProjectMember {
        +Long id
    }

    class Issue {
        +Long id
        +String title
        +String description
        +String issueKey
        +Priority priority
        +int position
    }

    class IssueStatus {
        +Long id
        +String name
        +StatusCategory category
        +boolean isDefault
    }

    class IssueType {
        +Long id
        +String name
    }

    class Label {
        +Long id
        +String name
        +String color
    }

    class Comment {
        +Long id
        +String content
    }

    class Attachment {
        +Long id
        +String fileName
        +String filePath
        +String contentType
        +long fileSize
    }

    class Sprint {
        +Long id
        +String name
        +String goal
        +SprintStatus status
        +LocalDate startDate
        +LocalDate endDate
    }

    class BoardColumn {
        +Long id
        +int position
    }

    class TimeLog {
        +Long id
        +BigDecimal hours
        +LocalDate logDate
        +String description
    }

    class WikiPage {
        +Long id
        +String title
        +String content
        +String slug
        +int position
    }

    class WikiPageIssueLink {
        +Long id
    }

    class AuditLog {
        +Long id
        +String entityType
        +Long entityId
        +Action action
        +String oldValue
        +String newValue
    }

    OrganizationConfig "1" --> "*" IssueType : defines
    OrganizationConfig "1" --> "*" IssueStatus : defines
    User "1" --> "*" Program : manages
    User "1" --> "*" Project : manages
    User "1" --> "*" Issue : reports
    User "1" --> "*" Issue : assigned to
    User "1" --> "*" TimeLog : logs
    User "1" --> "*" Comment : writes
    User "1" --> "*" WikiPage : authors
    User "1" --> "*" Attachment : uploads
    User "*" --> "*" Project : member of
    Program "1" --> "*" Project : contains
    Project "1" --> "*" Issue : contains
    Project "1" --> "*" Label : defines
    Project "1" --> "*" Sprint : has
    Project "1" --> "*" BoardColumn : configures
    Project "1" --> "*" WikiPage : contains
    Issue --> IssueStatus : has
    Issue --> IssueType : has
    Issue --> Sprint : belongs to
    Issue "*" --> "*" Label : tagged with
    Issue "1" --> "*" Comment : has
    Issue "1" --> "*" Attachment : has
    Issue "1" --> "*" TimeLog : tracked by
    WikiPage "1" --> "*" WikiPage : parent of
    WikiPage "*" --> "*" Issue : linked to
```

---

## 2. Use Case Diagram

What each role can do.

```mermaid
flowchart TB
    subgraph Admin
        A1[Manage users CRUD]
        A2[Manage organization config]
        A3[Manage issue types & statuses]
        A4[Manage programs & projects]
        A5[All Manager & Contributor actions]
    end

    subgraph Manager
        M1[Create & edit projects]
        M2[Assign contributors to projects]
        M3[Create & edit issues]
        M4[Manage sprints & backlog]
        M5[Configure Kanban board]
        M6[View team timesheets]
        M7[Manage wiki pages]
    end

    subgraph Contributor
        C1[Create & edit assigned issues]
        C2[Log time on assigned issues]
        C3[View own timesheet]
        C4[Add comments]
        C5[Manage wiki pages]
        C6[Upload attachments]
    end

    subgraph System
        S1[Login / Logout]
        S2[View Kanban board]
        S3[Search & filter issues]
        S4[View project documentation]
        S5[Edit own profile]
    end

    A1 & A2 & A3 & A4 --> A5
    M1 & M2 & M3 & M4 & M5 & M6 & M7
    C1 & C2 & C3 & C4 & C5 & C6
    S1 & S2 & S3 & S4 & S5
```

---

## 3. Issue Lifecycle (State Diagram)

How an issue moves through statuses.

```mermaid
stateDiagram-v2
    direction LR

    [*] --> ToDo : Issue created

    ToDo --> InProgress : Assign & start
    InProgress --> ToDo : Reopen / send back

    InProgress --> Review : Submit for review
    Review --> InProgress : Changes requested

    InProgress --> Done : Mark complete
    Review --> Done : Approve

    ToDo --> Done : Quick close

    state ToDo {
        [*] --> Backlog
        Backlog --> SprintAssigned : Added to sprint
        SprintAssigned --> Backlog : Removed from sprint
    }

    note right of Review : Optional status\nadded by admin
    note right of Done : Only status in\nDONE category
```

> Note: "Review" is an example of a custom status. The core statuses are To Do → In Progress → Done, but admins can add intermediate ones via `issue_status` configuration.

---

## 4. Authentication Flow (Sequence Diagram)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant SecurityFilter
    participant AuthController
    participant UserService
    participant SessionManager

    User->>Browser: Enter credentials
    Browser->>AuthController: POST /api/auth/login {username, password}
    AuthController->>UserService: authenticate(username, password)
    UserService->>UserService: Verify BCrypt hash
    alt Invalid credentials
        UserService-->>AuthController: throw AuthenticationException
        AuthController-->>Browser: 401 Unauthorized
        Browser-->>User: Show error message
    else Valid credentials
        UserService-->>AuthController: User entity
        AuthController->>SessionManager: createSession(user)
        SessionManager-->>AuthController: JSESSIONID cookie
        AuthController-->>Browser: 200 OK + user DTO + Set-Cookie
        Browser-->>User: Redirect to dashboard
    end

    Note over Browser,SecurityFilter: Subsequent requests

    Browser->>SecurityFilter: GET /api/issues (with JSESSIONID)
    SecurityFilter->>SessionManager: validateSession(JSESSIONID)
    SessionManager-->>SecurityFilter: Session valid
    SecurityFilter->>SecurityFilter: Check role permissions
    SecurityFilter-->>AuthController: Authorized request
    AuthController-->>Browser: 200 OK + data
```

---

## 5. Kanban Real-Time Update (Sequence Diagram)

How WebSocket keeps boards in sync across clients.

```mermaid
sequenceDiagram
    actor UserA
    actor UserB
    participant Server
    participant DB

    Note over UserA,UserB: Both viewing Kanban for Project X

    UserA->>Server: Drag issue JARI-42 from "To Do" to "In Progress"
    Server->>DB: UPDATE issue SET status_id=? WHERE id=42
    DB-->>Server: OK
    Server->>Server: Publish to /topic/kanban/{projectId}
    Server-->>UserA: STOMP message: {issueId:42, newStatus:"IN_PROGRESS"}
    Server-->>UserB: STOMP message: {issueId:42, newStatus:"IN_PROGRESS"}
    UserB->>UserB: Board updates instantly

    UserB->>Server: Drag issue JARI-15 from "In Progress" to "Done"
    Server->>DB: UPDATE issue SET status_id=? WHERE id=15
    DB-->>Server: OK
    Server->>Server: Publish to /topic/kanban/{projectId}
    Server-->>UserA: STOMP message: {issueId:15, newStatus:"DONE"}
    Server-->>UserB: STOMP message: {issueId:15, newStatus:"DONE"}
    UserA->>UserA: Board updates instantly
```

---

## 6. Backend Package Structure (Component Diagram)

```mermaid
flowchart TB
    subgraph jari-backend
        direction TB

        subgraph common
            STORAGE[StorageService<br/>FilesystemStorage]
            AUDIT[Audited<br/>annotation]
            EXC[GlobalExceptionHandler]
            DTO[DTOs & Mappers]
        end

        subgraph config
            SECURITY[SecurityConfig]
            WEBSOCKET[WebSocketConfig]
            CORS[CORS Config]
        end

        subgraph security
            AUTH_FILTER[AuthFilter]
            RBAC[RoleAuthorization]
        end

        subgraph user
            UC[UserController]
            US[UserService]
            UR[UserRepository]
        end

        subgraph program
            PC[ProgramController]
            PS[ProgramService]
            PR[ProgramRepository]
        end

        subgraph project
            PJC[ProjectController]
            PJS[ProjectService]
            PJR[ProjectRepository]
        end

        subgraph issue
            IC[IssueController]
            IS[IssueService]
            IR[IssueRepository]
        end

        subgraph sprint
            SC[SprintController]
            SS[SprintService]
            SR[SprintRepository]
        end

        subgraph timetracking
            TC[TimeLogController]
            TS[TimeLogService]
            TR[TimeLogRepository]
        end

        subgraph documentation
            WC[WikiPageController]
            WS[WikiPageService]
            WR[WikiPageRepository]
        end

        subgraph attachment
            AC[AttachmentController]
            AS[AttachmentService]
            AR[AttachmentRepository]
        end
    end

    STORAGE -.-> AS
    AUDIT -.-> IS
    AUDIT -.-> TS
    EXC -.-> IC & TC & WC
```

---

## 7. Time Tracking Flow (Sequence Diagram)

```mermaid
sequenceDiagram
    actor Contributor
    participant API
    participant TimeLogService
    participant IssueService
    participant DB

    Contributor->>API: POST /api/time-logs<br/>{issueId: 42, hours: 3.5, date: "2026-04-24", description: "Fixed login bug"}
    API->>API: Validate input
    API->>TimeLogService: createTimeLog(userId, dto)
    TimeLogService->>IssueService: verifyIssueAccessible(userId, 42)
    IssueService-->>TimeLogService: Issue found & user has access
    TimeLogService->>DB: INSERT time_log
    DB-->>TimeLogService: Saved
    TimeLogService-->>API: TimeLogDTO
    API-->>Contributor: 201 Created

    Note over Contributor,DB: Reporting

    Contributor->>API: GET /api/time-logs/weekly?userId=1&weekStart=2026-04-20
    API->>TimeLogService: getWeeklyTimesheet(userId, weekStart)
    TimeLogService->>DB: SELECT time_logs WHERE user_id=? AND log_date BETWEEN ? AND ?
    DB-->>TimeLogService: List of time logs
    TimeLogService-->>API: WeeklyTimesheetDTO
    API-->>Contributor: 200 OK + timesheet data
```