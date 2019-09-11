INSERT INTO organizations VALUES (1, 'common organization', 'common.dot');

INSERT INTO groups (id, organization_id, name, description) VALUES (1, 1, 'inventor', 'Built-in role');
INSERT INTO groups (id, organization_id, name, description) VALUES (2, 1, 'idea-manager', 'Built-in role');
INSERT INTO groups (id, organization_id, name, description) VALUES (3, 1, 'admin', 'Built-in role: organization admin');
INSERT INTO groups (id, organization_id, name, description) VALUES (4, 1, 'idea-reviewer', 'Built-in role');

INSERT INTO permissions (gid,resource,action) VALUES (3, 'users', 'READ, CREATE, EDIT, DELETE');
INSERT INTO permissions (gid,resource,action) VALUES (4, 'Comments', 'DELETE_OWN, EDIT_OWN');
