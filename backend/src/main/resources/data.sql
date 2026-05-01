-- Seed data for Jari (idempotent — safe to run on every startup)

-- Default issue types
MERGE INTO issue_type (id, name) KEY(id) VALUES (1, 'Project Management');
MERGE INTO issue_type (id, name) KEY(id) VALUES (2, 'Tech Lead');
MERGE INTO issue_type (id, name) KEY(id) VALUES (3, 'Architecture');
MERGE INTO issue_type (id, name) KEY(id) VALUES (4, 'Development');
MERGE INTO issue_type (id, name) KEY(id) VALUES (5, 'Data Analysis');
MERGE INTO issue_type (id, name) KEY(id) VALUES (6, 'Testing');

-- Default issue statuses
MERGE INTO issue_status (id, name, category, is_default) KEY(id) VALUES (1, 'To Do', 'TODO', TRUE);
MERGE INTO issue_status (id, name, category, is_default) KEY(id) VALUES (2, 'In Progress', 'IN_PROGRESS', FALSE);
MERGE INTO issue_status (id, name, category, is_default) KEY(id) VALUES (3, 'Done', 'DONE', FALSE);
MERGE INTO issue_status (id, name, category, is_default) KEY(id) VALUES (4, 'Closed', 'CLOSED', FALSE);