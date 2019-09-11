INSERT INTO organizations VALUES (1, 'common organization', 'common.dot');

SET @inventor_gid = 1;
INSERT INTO groups (id, organization_id, name, description) VALUES (@inventor_gid, 1, 'inventor', 'Built-in role');
INSERT INTO groups (id, organization_id, name, description) VALUES (2, 1, 'idea-manager', 'Built-in role');
INSERT INTO groups (id, organization_id, name, description) VALUES (3, 1, 'admin', 'Built-in role: organization admin');

INSERT INTO groups (organization_id, name, description) VALUES (1, 'idea-reviewer', 'Built-in role: supervisors that can read the entire idea  and can commented on it');
SET @reviewer_gid = LAST_INSERT_ID();

INSERT INTO permissions (gid,resource,action) VALUES (3, 'users', 'READ, CREATE, EDIT, DELETE');

-- Comments
INSERT INTO permissions (gid,resource,action) VALUES (@reviewer_gid, 'Comments', 'DELETE_OWN, EDIT_OWN');
INSERT INTO permissions (gid,resource,action) VALUES (@reviewer_gid, 'Ideas', 'READ, CREATE_COMMENT');

--  EDIT_COMMENT_OWN MUST NOT be granted as it cause that inventor will be able to EDIT all comments for the particular idea,
-- whereas s/he instead of restricting to the own comments only.
INSERT INTO permissions (gid,resource,action) VALUES (@inventor_gid, 'Ideas', 'CREATE_COMMENT_OWN, READ_COMMENT_OWN');
INSERT INTO permissions (gid,resource,action) VALUES (@inventor_gid, 'Comments', 'DELETE_OWN, EDIT_OWN');

