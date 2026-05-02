package com.jari.config;

import com.jari.company.Company;
import com.jari.company.CompanyRepository;
import com.jari.issue.Issue;
import com.jari.issue.IssueRepository;
import com.jari.pmo.RaidItem;
import com.jari.pmo.RaidItemRepository;
import com.jari.project.BoardColumn;
import com.jari.project.BoardColumnRepository;
import com.jari.project.Label;
import com.jari.project.LabelRepository;
import com.jari.project.Project;
import com.jari.project.ProjectFavorite;
import com.jari.project.ProjectFavoriteRepository;
import com.jari.project.ProjectMember;
import com.jari.project.ProjectMemberRepository;
import com.jari.project.ProjectRepository;
import com.jari.program.Program;
import com.jari.program.ProgramRepository;
import com.jari.sprint.Sprint;
import com.jari.sprint.Sprint.SprintStatus;
import com.jari.sprint.SprintRepository;
import com.jari.timetracking.TimeLog;
import com.jari.timetracking.TimeLogRepository;
import com.jari.timetracking.UserRate;
import com.jari.timetracking.UserRateRepository;
import com.jari.user.User;
import com.jari.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@Order(1)
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CompanyRepository companyRepository;
    private final OrganizationConfigRepository organizationConfigRepository;
    private final ProgramRepository programRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final IssueRepository issueRepository;
    private final IssueStatusRepository issueStatusRepository;
    private final IssueTypeRepository issueTypeRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final SprintRepository sprintRepository;
    private final LabelRepository labelRepository;
    private final RaidItemRepository raidItemRepository;
    private final TimeLogRepository timeLogRepository;
    private final UserRateRepository userRateRepository;
    private final ProjectFavoriteRepository projectFavoriteRepository;

    public DataSeeder(UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      CompanyRepository companyRepository,
                      OrganizationConfigRepository organizationConfigRepository,
                      ProgramRepository programRepository,
                      ProjectRepository projectRepository,
                      ProjectMemberRepository projectMemberRepository,
                      IssueRepository issueRepository,
                      IssueStatusRepository issueStatusRepository,
                      IssueTypeRepository issueTypeRepository,
                      BoardColumnRepository boardColumnRepository,
                      SprintRepository sprintRepository,
                      LabelRepository labelRepository,
                      RaidItemRepository raidItemRepository,
                      TimeLogRepository timeLogRepository,
                      UserRateRepository userRateRepository,
                      ProjectFavoriteRepository projectFavoriteRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.companyRepository = companyRepository;
        this.organizationConfigRepository = organizationConfigRepository;
        this.programRepository = programRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.issueRepository = issueRepository;
        this.issueStatusRepository = issueStatusRepository;
        this.issueTypeRepository = issueTypeRepository;
        this.boardColumnRepository = boardColumnRepository;
        this.sprintRepository = sprintRepository;
        this.labelRepository = labelRepository;
        this.raidItemRepository = raidItemRepository;
        this.timeLogRepository = timeLogRepository;
        this.userRateRepository = userRateRepository;
        this.projectFavoriteRepository = projectFavoriteRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 1) return;

        // Companies
        Company netopia = createCompany("Netopia", "NTO", "Digital innovation and technology solutions",
                "123 Innovation Drive, San Francisco, CA 94105", "https://netopia.io", "/logos/netopia.png");
        Company harmony = createCompany("Harmony", "HRM", "Consulting and organizational development",
                "456 Strategy Blvd, New York, NY 10001", "https://harmony.consulting", "/logos/harmony.png");
        Company myteam = createCompany("MyTeam", "MTM", "Team collaboration and productivity tools",
                "789 Collaboration Ave, Austin, TX 73301", "https://myteam.dev", "/logos/myteam.png");

        // Organization configs (per-company + global)
        createOrgConfig("Jari Global", null,
                "100 Main Street, San Francisco, CA 94102", "https://jari.app", "/logos/jari.png");
        createOrgConfig("Netopia", netopia,
                "123 Innovation Drive, San Francisco, CA 94105", "https://netopia.io", "/logos/netopia.png");
        createOrgConfig("Harmony", harmony,
                "456 Strategy Blvd, New York, NY 10001", "https://harmony.consulting", "/logos/harmony.png");
        createOrgConfig("MyTeam", myteam,
                "789 Collaboration Ave, Austin, TX 73301", "https://myteam.dev", "/logos/myteam.png");

        // Users
        User admin = createUser("admin", "admin@jari.com", "Admin", "User", User.Role.ADMIN, null);
        User majid = createUser("majid", "majid@jari.com", "Majid", "Hassan", User.Role.MANAGER, netopia);
        User dev1 = createUser("alex", "alex@jari.com", "Alex", "Chen", User.Role.CONTRIBUTOR, netopia);
        User dev2 = createUser("maria", "maria@jari.com", "Maria", "Garcia", User.Role.CONTRIBUTOR, netopia);
        User dev3 = createUser("james", "james@jari.com", "James", "Wilson", User.Role.CONTRIBUTOR, harmony);
        User dev4 = createUser("lee", "lee@jari.com", "Lee", "Park", User.Role.CONTRIBUTOR, harmony);
        User pmHarmony = createUser("diana", "diana@jari.com", "Diana", "Ross", User.Role.MANAGER, harmony);
        User salim = createUser("salim", "salim@jari.com", "Salim", "Al-Rashid", User.Role.EXECUTIVE, null);
        User bassamat = createUser("bassamat", "bassamat@jari.com", "Bassamat", "Tayeb", User.Role.EXTERNAL, null);

        // User rates for EVM
        createUserRate(admin, new BigDecimal("75.00"), LocalDate.of(2025, 1, 1));
        createUserRate(majid, new BigDecimal("90.00"), LocalDate.of(2025, 1, 1));
        createUserRate(dev1, new BigDecimal("65.00"), LocalDate.of(2025, 1, 1));
        createUserRate(dev2, new BigDecimal("70.00"), LocalDate.of(2025, 1, 1));
        createUserRate(dev3, new BigDecimal("60.00"), LocalDate.of(2025, 1, 1));
        createUserRate(dev4, new BigDecimal("55.00"), LocalDate.of(2025, 1, 1));
        createUserRate(pmHarmony, new BigDecimal("85.00"), LocalDate.of(2025, 1, 1));

        // Programs
        Program ehealth = createProgram("eHealth", "EH", "Digital health transformation initiative", majid, netopia);
        Program mobilePlatform = createProgram("Mobile Platform", "MOB", "Mobile app platform development", pmHarmony, harmony);
        Program globalInit = createProgram("Global Initiative", "GI", "Cross-company strategic initiative", salim, null);

        // Projects with PMO fields
        Project fse = createProject("FSE", "FSE", "Full Stack Engineering platform",
                ehealth, majid, Project.Stage.EXECUTION, 8,
                new BigDecimal("150000"), new BigDecimal("150000"), new BigDecimal("12000"),
                LocalDate.of(2025, 1, 15), LocalDate.of(2025, 9, 30), netopia);

        Project apiGateway = createProject("API Gateway", "AG", "Central API gateway and service mesh",
                ehealth, majid, Project.Stage.PLANNING, 6,
                new BigDecimal("80000"), new BigDecimal("80000"), new BigDecimal("3500"),
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 12, 15), netopia);

        Project mobileApp = createProject("Mobile App", "MA", "Cross-platform mobile application",
                mobilePlatform, pmHarmony, Project.Stage.EXECUTION, 7,
                new BigDecimal("200000"), new BigDecimal("200000"), new BigDecimal("45000"),
                LocalDate.of(2025, 2, 1), LocalDate.of(2025, 10, 31), harmony);

        Project infraUpgrade = createProject("Infrastructure Upgrade", "IU", "Cloud infrastructure modernization",
                globalInit, salim, Project.Stage.INITIATION, 5,
                new BigDecimal("50000"), new BigDecimal("50000"), BigDecimal.ZERO,
                LocalDate.of(2025, 6, 1), LocalDate.of(2025, 11, 30), null);

        // Add members
        addMember(fse, admin);
        addMember(fse, dev1);
        addMember(fse, dev2);
        addMember(apiGateway, dev1);
        addMember(apiGateway, admin);
        addMember(mobileApp, dev3);
        addMember(mobileApp, dev4);
        addMember(mobileApp, pmHarmony);
        addMember(mobileApp, admin);
        addMember(infraUpgrade, dev1);
        addMember(infraUpgrade, dev3);

        // External user assigned to FSE
        bassamat.setAssignedProject(fse);
        userRepository.save(bassamat);
        addMember(fse, bassamat);

        // Favorites (per-user)
        addFavorite(admin, fse);
        addFavorite(admin, mobileApp);

        // Board columns
        List<IssueStatus> allStatuses = issueStatusRepository.findAll();
        createBoardColumns(fse, allStatuses);
        createBoardColumns(apiGateway, allStatuses);
        createBoardColumns(mobileApp, allStatuses);
        createBoardColumns(infraUpgrade, allStatuses);

        // Sprints
        Sprint sprint1 = createSprint("Sprint 1", "FSE MVP features", fse,
                SprintStatus.ACTIVE, LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 14));
        Sprint sprint2 = createSprint("Sprint 2", "FSE enhancements", fse,
                SprintStatus.PLANNING, LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 28));
        Sprint sprintM1 = createSprint("Mobile Sprint 1", "Core mobile features", mobileApp,
                SprintStatus.ACTIVE, LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 14));

        // Issues for FSE
        IssueStatus todo = allStatuses.stream().filter(s -> s.getCategory() == IssueStatus.Category.TODO).findFirst().orElse(allStatuses.get(0));
        IssueStatus inProgress = allStatuses.stream().filter(s -> s.getCategory() == IssueStatus.Category.IN_PROGRESS).findFirst().orElse(allStatuses.get(1));
        IssueStatus done = allStatuses.stream().filter(s -> s.getCategory() == IssueStatus.Category.DONE).findFirst().orElse(allStatuses.get(2));
        IssueType dev = issueTypeRepository.findById(4L).orElse(null);
        IssueType mgmt = issueTypeRepository.findById(1L).orElse(null);
        IssueType test = issueTypeRepository.findById(6L).orElse(null);

        createIssue("FSE-1", "User authentication flow", fse, done, Issue.Priority.HIGH, dev, dev1, admin, sprint1, 0);
        createIssue("FSE-2", "Dashboard layout", fse, done, Issue.Priority.HIGH, dev, dev2, admin, sprint1, 1);
        createIssue("FSE-3", "Profile management", fse, inProgress, Issue.Priority.MEDIUM, dev, dev1, admin, sprint1, 2);
        createIssue("FSE-4", "Search functionality", fse, inProgress, Issue.Priority.MEDIUM, dev, dev2, admin, sprint2, 3);
        createIssue("FSE-5", "Notification system", fse, todo, Issue.Priority.LOW, dev, null, admin, sprint2, 4);
        createIssue("FSE-6", "Payment integration", fse, todo, Issue.Priority.HIGH, dev, null, admin, null, 5);
        createIssue("FSE-7", "Analytics reporting", fse, todo, Issue.Priority.MEDIUM, dev, null, majid, null, 6);

        // Issues for Mobile App
        createIssue("MA-1", "Login screen", mobileApp, done, Issue.Priority.HIGH, dev, dev3, pmHarmony, sprintM1, 0);
        createIssue("MA-2", "Navigation framework", mobileApp, done, Issue.Priority.HIGH, dev, dev4, pmHarmony, sprintM1, 1);
        createIssue("MA-3", "Push notifications", mobileApp, inProgress, Issue.Priority.MEDIUM, dev, dev3, pmHarmony, sprintM1, 2);
        createIssue("MA-4", "Offline mode", mobileApp, todo, Issue.Priority.HIGH, dev, null, pmHarmony, null, 3);
        createIssue("MA-5", "Camera integration", mobileApp, todo, Issue.Priority.LOW, dev, null, pmHarmony, null, 4);

        // Issues for API Gateway
        createIssue("AG-1", "Rate limiting module", apiGateway, inProgress, Issue.Priority.HIGH, dev, dev1, majid, null, 0);
        createIssue("AG-2", "Service discovery", apiGateway, todo, Issue.Priority.HIGH, dev, null, majid, null, 1);
        createIssue("AG-3", "Load balancer config", apiGateway, todo, Issue.Priority.MEDIUM, dev, null, majid, null, 2);

        // External issues (visible only to EXTERNAL users)
        Issue extIssue = createIssue("FSE-8", "Client feedback on login flow", fse, todo, Issue.Priority.MEDIUM, dev, bassamat, bassamat, null, 7);
        extIssue.setExternal(true);
        issueRepository.save(extIssue);

        // Labels
        createLabel(fse, "Frontend", "#3B82F6");
        createLabel(fse, "Backend", "#10B981");
        createLabel(fse, "Bug", "#EF4444");
        createLabel(mobileApp, "iOS", "#8B5CF6");
        createLabel(mobileApp, "Android", "#F59E0B");

        // Time logs for EVM (labor cost)
        LocalDate today = LocalDate.now();
        createTimeLog(fse, "FSE-3", dev1, new BigDecimal("6.5"), today.minusDays(4), "Profile API implementation");
        createTimeLog(fse, "FSE-3", dev1, new BigDecimal("4.0"), today.minusDays(3), "Profile validation logic");
        createTimeLog(fse, "FSE-4", dev2, new BigDecimal("7.0"), today.minusDays(3), "Search index setup");
        createTimeLog(fse, "FSE-4", dev2, new BigDecimal("5.0"), today.minusDays(2), "Search UI components");
        createTimeLog(fse, "FSE-1", dev1, new BigDecimal("8.0"), today.minusDays(10), "Auth flow - complete");
        createTimeLog(fse, "FSE-2", dev2, new BigDecimal("7.5"), today.minusDays(9), "Dashboard layout - complete");
        createTimeLog(mobileApp, "MA-3", dev3, new BigDecimal("6.0"), today.minusDays(2), "Push notification backend");
        createTimeLog(mobileApp, "MA-3", dev3, new BigDecimal("5.0"), today.minusDays(1), "Push notification UI");
        createTimeLog(mobileApp, "MA-1", dev3, new BigDecimal("8.0"), today.minusDays(12), "Login screen - complete");
        createTimeLog(mobileApp, "MA-2", dev4, new BigDecimal("7.0"), today.minusDays(11), "Navigation - complete");

        // RAID items
        createRaidItem(fse, RaidItem.RaidType.RISK, "Data breach vulnerability",
                "Customer PII may be exposed if authentication tokens are compromised",
                RaidItem.RaidStatus.MITIGATING, 4, 5, "Implement token rotation and encryption at rest",
                dev1, today.plusMonths(1));

        createRaidItem(fse, RaidItem.RaidType.RISK, "Third-party API downtime",
                "Payment provider API has had 3 outages in the last quarter",
                RaidItem.RaidStatus.OPEN, 3, 4, "Implement fallback payment provider",
                majid, today.plusMonths(2));

        createRaidItem(fse, RaidItem.RaidType.ASSUMPTION, "Customers will adopt self-service portal",
                "Assuming 60% adoption rate within 6 months based on industry benchmarks",
                RaidItem.RaidStatus.OPEN, null, null, null, null, null);

        createRaidItem(fse, RaidItem.RaidType.DEPENDENCY, "SSO provider integration",
                "Depends on corporate IT completing SSO setup",
                RaidItem.RaidStatus.OPEN, null, null, null, majid, today.plusWeeks(2));

        createRaidItem(mobileApp, RaidItem.RaidType.RISK, "App store rejection",
                "Apple may reject the app for privacy policy compliance",
                RaidItem.RaidStatus.OPEN, 3, 5, "Early submission for review and policy alignment",
                pmHarmony, today.plusMonths(1));

        createRaidItem(mobileApp, RaidItem.RaidType.ISSUE, "Memory leak on Android",
                "Android builds showing increasing memory usage over time",
                RaidItem.RaidStatus.MITIGATING, null, null, null, dev3, today.plusWeeks(3));

        createRaidItem(apiGateway, RaidItem.RaidType.RISK, "Scalability bottleneck",
                "Current architecture may not handle 10x traffic growth",
                RaidItem.RaidStatus.OPEN, 2, 5, "Design horizontal scaling strategy",
                dev1, today.plusMonths(3));

        createRaidItem(apiGateway, RaidItem.RaidType.ASSUMPTION, "Microservices adoption will continue",
                "Assuming teams will adopt the gateway for new services",
                RaidItem.RaidStatus.OPEN, null, null, null, null, null);

        createRaidItem(infraUpgrade, RaidItem.RaidType.DEPENDENCY, "Cloud vendor contract renewal",
                "Infrastructure upgrade depends on cloud contract renewal",
                RaidItem.RaidStatus.OPEN, null, null, null, majid, today.plusMonths(2));
    }

    private User createUser(String username, String email, String firstName, String lastName, User.Role role, Company company) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(role);
        user.setActive(true);
        user.setCompany(company);
        return userRepository.save(user);
    }

    private Company createCompany(String name, String key, String description, String address, String website, String logo) {
        Company company = new Company();
        company.setName(name);
        company.setKey(key);
        company.setDescription(description);
        company.setAddress(address);
        company.setWebsite(website);
        company.setLogo(logo);
        company.setActive(true);
        return companyRepository.save(company);
    }

    private OrganizationConfig createOrgConfig(String name, Company company, String address, String website, String logo) {
        OrganizationConfig config = new OrganizationConfig();
        config.setName(name);
        config.setAddress(address);
        config.setWebsite(website);
        config.setLogo(logo);
        config.setCompany(company);
        return organizationConfigRepository.save(config);
    }

    private UserRate createUserRate(User user, BigDecimal hourlyRate, LocalDate effectiveFrom) {
        UserRate rate = new UserRate();
        rate.setUser(user);
        rate.setHourlyRate(hourlyRate);
        rate.setEffectiveFrom(effectiveFrom);
        return userRateRepository.save(rate);
    }

    private Program createProgram(String name, String key, String description, User manager, Company company) {
        Program program = new Program();
        program.setName(name);
        program.setKey(key);
        program.setDescription(description);
        program.setManager(manager);
        program.setCompany(company);
        return programRepository.save(program);
    }

    private Project createProject(String name, String key, String description, Program program,
                                  User manager, Project.Stage stage, int strategicScore,
                                  BigDecimal plannedValue, BigDecimal budget, BigDecimal budgetSpent,
                                  LocalDate targetStartDate, LocalDate targetEndDate, Company company) {
        Project project = new Project();
        project.setName(name);
        project.setKey(key);
        project.setDescription(description);
        project.setProgram(program);
        project.setManager(manager);
        project.setStage(stage);
        project.setStrategicScore(strategicScore);
        project.setPlannedValue(plannedValue);
        project.setBudget(budget);
        project.setBudgetSpent(budgetSpent);
        project.setTargetStartDate(targetStartDate);
        project.setTargetEndDate(targetEndDate);
        project.setCompany(company);
        return projectRepository.save(project);
    }

    private void addMember(Project project, User user) {
        projectMemberRepository.save(new ProjectMember(project, user));
    }

    private void addFavorite(User user, Project project) {
        projectFavoriteRepository.save(new ProjectFavorite(user, project));
    }

    private void createBoardColumns(Project project, List<IssueStatus> statuses) {
        int pos = 0;
        for (IssueStatus status : statuses) {
            boardColumnRepository.save(new BoardColumn(project, status, pos++));
        }
    }

    private Sprint createSprint(String name, String goal, Project project, SprintStatus status,
                               LocalDate startDate, LocalDate endDate) {
        Sprint sprint = new Sprint();
        sprint.setName(name);
        sprint.setGoal(goal);
        sprint.setProject(project);
        sprint.setStatus(status);
        sprint.setStartDate(startDate);
        sprint.setEndDate(endDate);
        return sprintRepository.save(sprint);
    }

    private Issue createIssue(String issueKey, String title, Project project, IssueStatus status,
                             Issue.Priority priority, IssueType type, User assignee, User reporter,
                             Sprint sprint, int position) {
        Issue issue = new Issue();
        issue.setIssueKey(issueKey);
        issue.setTitle(title);
        issue.setProject(project);
        issue.setStatus(status);
        issue.setPriority(priority);
        issue.setType(type);
        issue.setAssignee(assignee);
        issue.setReporter(reporter);
        issue.setSprint(sprint);
        issue.setPosition(position);
        return issueRepository.save(issue);
    }

    private Label createLabel(Project project, String name, String color) {
        Label label = new Label();
        label.setName(name);
        label.setColor(color);
        label.setProject(project);
        return labelRepository.save(label);
    }

    private void createTimeLog(Project project, String issueKey, User user, BigDecimal hours,
                               LocalDate logDate, String description) {
        List<Issue> issues = issueRepository.findByProjectId(project.getId(), org.springframework.data.domain.PageRequest.of(0, 100))
                .stream().filter(i -> i.getIssueKey().equals(issueKey)).toList();
        if (issues.isEmpty()) return;
        Issue issue = issues.get(0);

        TimeLog log = new TimeLog();
        log.setIssue(issue);
        log.setUser(user);
        log.setHours(hours);
        log.setLogDate(logDate);
        log.setDescription(description);
        timeLogRepository.save(log);
    }

    private RaidItem createRaidItem(Project project, RaidItem.RaidType type, String title, String description,
                                    RaidItem.RaidStatus status, Integer probability, Integer impact,
                                    String mitigationPlan, User owner, LocalDate dueDate) {
        RaidItem item = new RaidItem();
        item.setProject(project);
        item.setType(type);
        item.setTitle(title);
        item.setDescription(description);
        item.setStatus(status);
        item.setProbability(probability);
        item.setImpact(impact);
        item.setMitigationPlan(mitigationPlan);
        item.setOwner(owner);
        item.setDueDate(dueDate);
        return raidItemRepository.save(item);
    }
}