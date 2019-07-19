#SET sql_mode=(SELECT CONCAT(@@sql_mode,',NO_AUTO_VALUE_ON_ZERO'));


INSERT INTO organizations VALUES (2, 'ACME', 'acme.com');
INSERT INTO organizations VALUES (3, 'EMCA', 'emca.com');

INSERT INTO users VALUES (1, 2, 'inventor1@acme', 'pw1', 'salt1');
INSERT INTO users VALUES (2, 2, 'inventor2@acme', 'pw2', 'salt2');
INSERT INTO users VALUES (3, 2, 'inventor3@acme', 'pw3', 'salt3');
INSERT INTO users VALUES (4, 2, 'manager@acme', 'pw4', 'salt4');

INSERT INTO users VALUES (5, 3, 'inventor1@emca', 'pw1', 'salt1');
INSERT INTO users VALUES (6, 3, 'inventor2@emca', 'pw2', 'salt2');
INSERT INTO users VALUES (7, 3, 'inventor3@emca', 'pw3', 'salt3');
INSERT INTO users VALUES (8, 3, 'manager@emca', 'pw4', 'salt4');
INSERT INTO users VALUES (9, 3, 'admin@emca', 'pw5', 'salt5');


INSERT INTO roles VALUES (4, 3, 'shared-idea-inventors', 'Inventors that can work with shared ideas');
SET @shared_iventors_roleid = (SELECT id FROM roles WHERE name = 'shared-idea-inventors');
INSERT INTO permissions VALUES (0, @shared_iventors_roleid, null, 'IdEaS', null, 'READ_OWN, EDIT_OWN');

INSERT INTO user_roles VALUES (1,1);
INSERT INTO user_roles VALUES (2,1);
INSERT INTO user_roles VALUES (3,1);
INSERT INTO user_roles VALUES (4,2);

INSERT INTO user_roles VALUES (5,1);
INSERT INTO user_roles VALUES (5,@shared_iventors_roleid);

INSERT INTO user_roles VALUES (6,1);
INSERT INTO user_roles VALUES (6,@shared_iventors_roleid);

INSERT INTO user_roles VALUES (7,1);
INSERT INTO user_roles VALUES (7,@shared_iventors_roleid);

INSERT INTO user_roles VALUES (8,2);
INSERT INTO user_roles VALUES (9,3); -- grant organization admin role


INSERT INTO permissions (id, role_id, user_id, resource, resource_instance, action)
    VALUES (0, 1, null, 'ideas', NULL, 'READ_OWN, CREATE, EDIT_OWN, DELETE_OWN');

INSERT INTO permissions VALUES (0, 2, null, 'IDEAS', NULL, 'READ, EDIT, DELETE');
INSERT INTO permissions VALUES (0, null, 2, 'ideas', 1, 'READ');
INSERT INTO permissions VALUES (0, null, 2, 'IdEaS', 2, 'READ_OWN');

INSERT INTO ideas (id, organization_id, owner_id, owner_role_id, name, title)
    VALUES (1, 2, 1, null, 'idea1@acme', 'the 1st idea of inventor1@acme');

INSERT INTO ideas VALUES (2, 2, 1, null, 'idea2@acme', 'the 2nd idea of inventor1@acme');
INSERT INTO ideas VALUES (3, 2, 2, null, 'idea1@acme', 'the 1st idea of inventor2@acme');
INSERT INTO ideas VALUES (4, 2, 2, null, 'idea2@acme', 'the 2nd idea of inventor2@acme');

INSERT INTO ideas VALUES (9, 2, null, 1, 'shared-idea1@acme', 'the 1st shared idea at acme' );
INSERT INTO ideas VALUES (10, 2, null, 1, 'shared-idea2@acme', 'the 2nd shared idea at acme' );

SET @DISABLE_TRIGGERS=1;
INSERT INTO ideas VALUES (11, 2, null, null, 'orphan-idea1@acme', 'the 1st orphan idea at acme' );
INSERT INTO ideas VALUES (12, 2, null, null, 'orphan-idea2@acme', 'the 2nd orphan idea at acme' );
SET @DISABLE_TRIGGERS=NULL;

INSERT INTO ideas VALUES (5, 3, 5, null, 'idea1@emca', 'the 1st idea of inventor1@emca' );
INSERT INTO ideas VALUES (6, 3, 5, null, 'idea2@emca', 'the 2nd idea of inventor1@emca' );
INSERT INTO ideas VALUES (7, 3, 5, null, 'idea1@emca', 'the 1st idea of inventor2@emca' );
INSERT INTO ideas VALUES (8, 3, 6, null, 'idea2@emca', 'the 2nd idea of inventor2@emca' );


INSERT INTO ideas VALUES (13, 3, null, @shared_iventors_roleid, 'shared-idea1@emca', 'the 1st shared idea at emca' );
INSERT INTO ideas VALUES (14, 3, null, @shared_iventors_roleid, 'shared-idea2@emca', 'the 2nd shared idea at emca' );

SET @DISABLE_TRIGGERS=1;
INSERT INTO ideas VALUES (15, 3, null, null, 'orphan-idea1@emca', 'the 1st orphan idea at emca' );
INSERT INTO ideas VALUES (16, 3, null, null, 'orphan-idea2@emca', 'the 2nd orphan idea at emca' );
SET @DISABLE_TRIGGERS=NULL;
