use dbTest;

INSERT INTO organization VALUES (1, 'common organization', 'common.dot', 'it is a common organization');

INSERT INTO `group` (id, name, description, organizationId) VALUES (1, 'inventor private', 'Built-in role: can create, read own and shared, edit own and shared ideas; read and create comments; edit and delete own comments.', 1);
INSERT INTO `group` (id, name, description, organizationId) VALUES (2, 'invention manager', 'Built-in role: can read, re-assign, import and share ideas; read and create comments; edit and delete own comments.', 1);
INSERT INTO `group` (id, name, description, organizationId) VALUES (3, 'opus admin', 'Built-in role: can manage organizations.', 1);
INSERT INTO `group` (id, name, description, organizationId) VALUES (4, 'reviewer', 'Built-in role: can read the entire idea and can commented on it.', 1);
INSERT INTO `group` (id, name, description, organizationId) VALUES (5, 'organization admin', 'Built-in role: can manage users, groups and permissions within organization.', 1);
INSERT INTO `group` (id, name, description, organizationId) VALUES (6, 'inventor shared', 'Built-in role: can read and edit shared ideas; create and read comments; edit and delete own comments.', 1);

-- opus admin should be able to work with CRUD operations for ORGANIZATION domain
INSERT INTO permission (groupId, resource, actions, organizationId) VALUES (3, 'ORGANIZATION', 'READ,CREATE,EDIT,DELETE', 1);
-- organization admin should be able to work with CRUD operations for USER / PERMISSION / GROUP domain
INSERT INTO permission (groupId, resource, actions, organizationId) VALUES (5, 'USER', 'READ,CREATE,EDIT,DELETE', 1);
INSERT INTO permission (groupId, resource, actions, organizationId) VALUES (5, 'PERMISSION', 'READ,CREATE,EDIT,DELETE', 1);
INSERT INTO permission (groupId, resource, actions, organizationId) VALUES (5, 'GROUP', 'READ,CREATE,EDIT,DELETE', 1);

-- ideas and comments
INSERT INTO permission (groupId, resource, actions, organizationId) VALUES (1, 'USER_IDEA', 'CREATE,READ_OWN,EDIT_OWN,READ_COMMENT_OWN,CREATE_COMMENT_OWN', 1);
INSERT INTO permission (groupId, resource, actions, organizationId) VALUES (1, 'COMMENT', 'DELETE_OWN,EDIT_OWN', 1);
INSERT INTO permission (groupId, resource, actions, organizationId) VALUES (2, 'USER_IDEA', 'READ,RE_ASSIGN,READ_COMMENT,CREATE_COMMENT,DELETE,IMPORT,SHARE_OWN', 1);
INSERT INTO permission (groupId, resource, actions, organizationId) VALUES (2, 'COMMENT', 'DELETE_OWN,EDIT_OWN', 1);
INSERT INTO permission (groupId, resource, actions, organizationId) VALUES (4, 'COMMENT', 'DELETE_OWN,EDIT_OWN', 1);
INSERT INTO permission (groupId, resource, actions, organizationId) VALUES (6, 'COMMENT', 'DELETE_OWN,EDIT_OWN', 1);
