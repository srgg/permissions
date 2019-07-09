INSERT INTO organizations VALUES (1, 'common organization', 'common.dot');

INSERT INTO roles VALUES (1, 1, 'inventor', null);
INSERT INTO roles VALUES (2, 1, 'idea-manager', null);
INSERT INTO roles VALUES (3, 1, 'admin', 'Organization admin');

INSERT INTO permissions VALUES (0, 3, null, 'users', NULL, 'READ, CREATE, EDIT, DELETE');

