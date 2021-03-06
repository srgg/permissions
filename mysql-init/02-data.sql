SET @common_oid = 1;
INSERT INTO organizations VALUES (@common_oid, 'common organization', 'common.dot');

SET @inventor_gid = 1;
INSERT INTO groups (id, organization_id, name, description) VALUES (@inventor_gid, @common_oid, 'inventor', 'Built-in role');

SET @manager_gid = 2;
INSERT INTO groups (id, organization_id, name, description) VALUES (@manager_gid, @common_oid, 'idea-manager', 'Built-in role');

SET @admin_gid = 3;
INSERT INTO groups (id, organization_id, name, description) VALUES (@admin_gid, @common_oid, 'admin', 'Built-in role: organization admin');

INSERT INTO groups (organization_id, name, description) VALUES (@common_oid, 'idea-reviewer', 'Built-in role: supervisors that can read the entire idea  and can commented on it');
SET @reviewer_gid = LAST_INSERT_ID();

SET @platform_admin_gid = 4;
INSERT INTO groups (id, organization_id, name, description) VALUES (@platform_admin_gid, @common_oid, 'platform admin', 'Built-in role: entire platform admin');

SET @DISABLE_TRIGGERS=1;

INSERT INTO permissions (id, organization_id, gid,domain,action) VALUES (1,@common_oid,  @platform_admin_gid, 'organizations', 'READ, CREATE, EDIT, DELETE');
INSERT INTO permissions (organization_id, gid,domain,action) VALUES (@common_oid, @admin_gid, 'users', 'READ, CREATE, EDIT, DELETE');
INSERT INTO permissions (organization_id, gid,domain,action) VALUES (@common_oid, @admin_gid, 'permissions', 'READ, CREATE, EDIT, DELETE');

-- Comments
INSERT INTO permissions (organization_id, gid,domain,action) VALUES (@common_oid, @reviewer_gid, 'Comments', 'READ_OWN, DELETE_OWN, EDIT_OWN');

-- Ideas
INSERT INTO permissions (organization_id, gid, domain, action) VALUES (@common_oid, @inventor_gid, 'Ideas', 'READ_OWN, CREATE, EDIT_OWN, DELETE_OWN');
INSERT INTO permissions (organization_id, gid, domain, action) VALUES (@common_oid, @manager_gid, 'IDEAS', 'READ, EDIT, DELETE');
INSERT INTO permissions (organization_id, gid, domain, action) VALUES (@common_oid, @reviewer_gid, 'Ideas', 'READ_SHARED, CREATE-COMMENT_SHARED');


--  EDIT_COMMENT_OWN MUST NOT be granted as it cause that inventor will be able to EDIT all comments for the particular idea,
-- whereas s/he instead of restricting to the own comments only.
INSERT INTO permissions (organization_id, gid,domain,action) VALUES (@common_oid, @inventor_gid, 'Ideas', 'CREATE-COMMENT_OWN, READ-COMMENT_OWN');
INSERT INTO permissions (organization_id, gid,domain,action) VALUES (@common_oid, @inventor_gid, 'Comments', 'DELETE_OWN, EDIT_OWN');

SET @DISABLE_TRIGGERS=0;
