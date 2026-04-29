package com.jari.project;

import com.jari.common.exception.DuplicateKeyException;
import com.jari.common.exception.EntityNotFoundException;
import com.jari.common.exception.ForbiddenException;
import com.jari.config.IssueStatus;
import com.jari.config.IssueStatusRepository;
import com.jari.program.Program;
import com.jari.program.ProgramRepository;
import com.jari.issue.IssueRepository;
import com.jari.user.User;
import com.jari.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final LabelRepository labelRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final ProgramRepository programRepository;
    private final UserRepository userRepository;
    private final IssueStatusRepository statusRepository;
    private final IssueRepository issueRepository;
    private final ProjectFavoriteRepository favoriteRepository;

    public ProjectService(ProjectRepository projectRepository, ProjectMemberRepository memberRepository,
                          LabelRepository labelRepository, BoardColumnRepository boardColumnRepository,
                          ProgramRepository programRepository, UserRepository userRepository,
                          IssueStatusRepository statusRepository, IssueRepository issueRepository,
                          ProjectFavoriteRepository favoriteRepository) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.labelRepository = labelRepository;
        this.boardColumnRepository = boardColumnRepository;
        this.programRepository = programRepository;
        this.userRepository = userRepository;
        this.statusRepository = statusRepository;
        this.issueRepository = issueRepository;
        this.favoriteRepository = favoriteRepository;
    }

    @Transactional(readOnly = true)
    public Page<Project> search(String search, Long programId, Long managerId, int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);
        return projectRepository.search(search, programId, managerId, pageRequest);
    }

    @Transactional(readOnly = true)
    public Page<Project> searchByMember(Long userId, int page, int size) {
        return projectRepository.findByMemberUserId(userId, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Project getById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project", id));
    }

    @Transactional
    public Project create(ProjectDto.CreateRequest request) {
        if (projectRepository.existsByKey(request.key())) {
            throw new DuplicateKeyException("Project key already exists: " + request.key());
        }
        Program program = programRepository.findById(request.programId())
                .orElseThrow(() -> new EntityNotFoundException("Program", request.programId()));
        User manager = userRepository.findById(request.managerId())
                .orElseThrow(() -> new EntityNotFoundException("User", request.managerId()));

        Project project = new Project();
        project.setName(request.name());
        project.setKey(request.key().toUpperCase());
        project.setDescription(request.description());
        project.setProgram(program);
        project.setManager(manager);
        if (request.stage() != null) project.setStage(Project.Stage.valueOf(request.stage()));
        if (request.strategicScore() != null) project.setStrategicScore(request.strategicScore());
        if (request.plannedValue() != null) project.setPlannedValue(new BigDecimal(request.plannedValue()));
        if (request.budget() != null) project.setBudget(new BigDecimal(request.budget()));
        if (request.targetStartDate() != null) project.setTargetStartDate(LocalDate.parse(request.targetStartDate()));
        if (request.targetEndDate() != null) project.setTargetEndDate(LocalDate.parse(request.targetEndDate()));
        project = projectRepository.save(project);

        // Add manager as member
        memberRepository.save(new ProjectMember(project, manager));

        // Add listed members
        if (request.memberIds() != null) {
            for (Long memberId : request.memberIds()) {
                if (!memberId.equals(request.managerId())) {
                    User member = userRepository.findById(memberId)
                            .orElseThrow(() -> new EntityNotFoundException("User", memberId));
                    memberRepository.save(new ProjectMember(project, member));
                }
            }
        }

        // Create default board columns from all statuses
        List<IssueStatus> allStatuses = statusRepository.findAll();
        int position = 0;
        for (IssueStatus status : allStatuses) {
            boardColumnRepository.save(new BoardColumn(project, status, position++));
        }

        return project;
    }

    @Transactional
    public Project update(Long id, ProjectDto.UpdateRequest request) {
        Project project = getById(id);
        if (request.name() != null) project.setName(request.name());
        if (request.description() != null) project.setDescription(request.description());
        if (request.managerId() != null) {
            User manager = userRepository.findById(request.managerId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.managerId()));
            project.setManager(manager);
        }
        if (request.stage() != null) project.setStage(Project.Stage.valueOf(request.stage()));
        if (request.strategicScore() != null) project.setStrategicScore(request.strategicScore());
        if (request.plannedValue() != null) project.setPlannedValue(new BigDecimal(request.plannedValue()));
        if (request.budget() != null) project.setBudget(new BigDecimal(request.budget()));
        if (request.budgetSpent() != null) project.setBudgetSpent(new BigDecimal(request.budgetSpent()));
        if (request.targetStartDate() != null) project.setTargetStartDate(LocalDate.parse(request.targetStartDate()));
        if (request.targetEndDate() != null) project.setTargetEndDate(LocalDate.parse(request.targetEndDate()));
        return projectRepository.save(project);
    }

    // Favorites
    @Transactional(readOnly = true)
    public Set<Long> getFavoriteProjectIds(Long userId) {
        return favoriteRepository.findProjectIdsByUserId(userId);
    }

    @Transactional
    public boolean toggleFavorite(Long projectId, Long userId) {
        getById(projectId); // ensure project exists
        if (favoriteRepository.existsByUserIdAndProjectId(userId, projectId)) {
            favoriteRepository.deleteByUserIdAndProjectId(userId, projectId);
            return false;
        } else {
            User user = userRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("User", userId));
            Project project = getById(projectId);
            favoriteRepository.save(new ProjectFavorite(user, project));
            return true;
        }
    }

    @Transactional
    public void delete(Long id) {
        Project project = getById(id);
        projectRepository.delete(project);
    }

    // Members
    @Transactional(readOnly = true)
    public List<ProjectMember> getMembers(Long projectId) {
        return memberRepository.findByProjectId(projectId);
    }

    @Transactional
    public void addMembers(Long projectId, List<Long> userIds) {
        Project project = getById(projectId);
        for (Long userId : userIds) {
            if (!memberRepository.existsByProjectIdAndUserId(projectId, userId)) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new EntityNotFoundException("User", userId));
                memberRepository.save(new ProjectMember(project, user));
            }
        }
    }

    @Transactional
    public void removeMember(Long projectId, Long userId) {
        Project project = getById(projectId);
        if (project.getManager().getId().equals(userId)) {
            throw new ForbiddenException("Cannot remove project manager from project");
        }
        memberRepository.deleteByProjectIdAndUserId(projectId, userId);
    }

    @Transactional(readOnly = true)
    public boolean isMember(Long projectId, Long userId) {
        return memberRepository.existsByProjectIdAndUserId(projectId, userId);
    }

    // Labels
    @Transactional(readOnly = true)
    public List<Label> getLabels(Long projectId) {
        return labelRepository.findByProjectId(projectId);
    }

    @Transactional
    public Label createLabel(Long projectId, ProjectDto.LabelCreateRequest request) {
        Project project = getById(projectId);
        Label label = new Label();
        label.setName(request.name());
        label.setColor(request.color());
        label.setProject(project);
        return labelRepository.save(label);
    }

    @Transactional
    public Label updateLabel(Long projectId, Long labelId, ProjectDto.LabelCreateRequest request) {
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new EntityNotFoundException("Label", labelId));
        label.setName(request.name());
        label.setColor(request.color());
        return labelRepository.save(label);
    }

    @Transactional
    public void deleteLabel(Long labelId) {
        labelRepository.deleteById(labelId);
    }

    // Board configuration
    @Transactional(readOnly = true)
    public ProjectDto.BoardConfigDto getBoardConfig(Long projectId) {
        Project project = getById(projectId);
        List<BoardColumn> columns = boardColumnRepository.findByProjectIdOrderByPosition(projectId);
        List<ProjectDto.BoardColumnDto> columnDtos = columns.stream().map(col -> {
            long count = issueRepository.countByProjectIdAndStatusId(projectId, col.getStatus().getId());
            return new ProjectDto.BoardColumnDto(col.getId(), col.getStatus().getId(), col.getStatus().getName(), col.getPosition(), count);
        }).toList();
        return new ProjectDto.BoardConfigDto(projectId, columnDtos);
    }

    @Transactional
    public void updateBoardConfig(Long projectId, List<ProjectDto.BoardUpdateRequest.ColumnEntry> entries) {
        Project project = getById(projectId);
        boardColumnRepository.deleteByProjectId(projectId);
        for (ProjectDto.BoardUpdateRequest.ColumnEntry entry : entries) {
            IssueStatus status = statusRepository.findById(entry.statusId())
                    .orElseThrow(() -> new EntityNotFoundException("IssueStatus", entry.statusId()));
            boardColumnRepository.save(new BoardColumn(project, status, entry.position()));
        }
    }
}