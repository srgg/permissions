SET sql_mode=(SELECT CONCAT(@@sql_mode,',NO_AUTO_VALUE_ON_ZERO'));


INSERT INTO users VALUES (1, 'inventor1', 'pw1', 'salt1');
INSERT INTO users VALUES (2, 'inventor2', 'pw2', 'salt2');
INSERT INTO users VALUES (3, 'manager', 'pw3', 'salt3');


INSERT INTO roles VALUES (1, 'inventor');
INSERT INTO roles VALUES (2, 'idea-manager');

INSERT INTO user_roles VALUES (1,1);
INSERT INTO user_roles VALUES (2,1);
INSERT INTO user_roles VALUES (3,2);

INSERT INTO permissions VALUES (1, 1, null, 'IDEA', NULL, 'READ_OWN, CREATE, EDIT_OWN, DELETE_OWN');
INSERT INTO permissions VALUES (2, 2, null, 'IDEA', NULL, 'READ, CREATE, EDIT, DELETE');
INSERT INTO permissions VALUES (3, null, 2, 'IDEA', 1, 'READ');
INSERT INTO permissions VALUES (4, null, 2, 'IDEA', 2, 'READ_OWN');

INSERT INTO ideas VALUES (1, 1, 'idea1', 'the 1st idea of inventor1' );
INSERT INTO ideas VALUES (2, 1, 'idea2', 'the 2nd idea of inventor1' );
INSERT INTO ideas VALUES (3, 2, 'idea1', 'the 1st idea of inventor2' );
INSERT INTO ideas VALUES (4, 2, 'idea2', 'the 2nd idea of inventor2' );
