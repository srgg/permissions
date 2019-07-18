INSERT INTO organizations VALUES (1, 'common organization', 'common.dot');

INSERT INTO roles VALUES (1, 1, 'inventor', 'Built-in role');
INSERT INTO roles VALUES (2, 1, 'idea-manager', 'Built-in role');
INSERT INTO roles VALUES (3, 1, 'admin', 'Built-in role: organization admin');

INSERT INTO permissions VALUES (0, 3, null, 'users', NULL, 'READ, CREATE, EDIT, DELETE');

