#SET sql_mode=(SELECT CONCAT(@@sql_mode,',NO_AUTO_VALUE_ON_ZERO'));


INSERT INTO organizations VALUES (2, 'ACME', 'acme.com');
INSERT INTO organizations VALUES (3, 'EMCA', 'emca.com');
SET @emca = 3;

INSERT INTO users VALUES (1, 2, 'inventor1@acme', 'pw1', 'salt1');
INSERT INTO users VALUES (2, 2, 'inventor2@acme', 'pw2', 'salt2');
INSERT INTO users VALUES (3, 2, 'inventor3@acme', 'pw3', 'salt3');
INSERT INTO users VALUES (4, 2, 'manager@acme', 'pw4', 'salt4');

INSERT INTO users VALUES (5, @emca, 'inventor1@emca', 'pw1', 'salt1');
INSERT INTO users VALUES (6, @emca, 'inventor2@emca', 'pw2', 'salt2');
INSERT INTO users VALUES (7, @emca, 'inventor3@emca', 'pw3', 'salt3');
INSERT INTO users VALUES (8, @emca, 'manager@emca', 'pw4', 'salt4');
INSERT INTO users VALUES (9, @emca, 'admin@emca', 'pw5', 'salt5');
INSERT INTO users VALUES (10, @emca, 'reviewer1@emca', 'pw6', 'salt6');
INSERT INTO users VALUES (11, @emca, 'reviewer2@emca', 'pw7', 'salt7');


-- Shared Idea Inventors
INSERT INTO groups VALUES (100, @emca, 'shared-idea-inventors', 'Inventors that can work with shared ideas');
SET @shared_iventors_gid = (SELECT id FROM groups WHERE name = 'shared-idea-inventors');
INSERT INTO permissions (gid,resource,action) VALUES (@shared_iventors_gid, 'IdEaS', 'READ_OWN, EDIT_OWN');

-- Reviewers
INSERT INTO groups  VALUES (101, @emca, 'idea-reviewers', 'Supervisors that can read the entire idea  and can commented on it');
SET @reveiwers_gid = (SELECT id FROM groups WHERE name = 'idea-reviewers');
INSERT INTO permissions (gid,resource,action) VALUES (@reveiwers_gid, 'Comments', 'DELETE_OWN, EDIT_OWN');
INSERT INTO permissions (gid,resource,action) VALUES (@reveiwers_gid, 'Ideas', 'READ');

INSERT INTO user_groups VALUES (1,1);
INSERT INTO user_groups VALUES (2,1);
INSERT INTO user_groups VALUES (3,1);
INSERT INTO user_groups VALUES (4,2);

INSERT INTO user_groups VALUES (5,1);
INSERT INTO user_groups VALUES (5,@shared_iventors_gid);

INSERT INTO user_groups VALUES (6,1);
INSERT INTO user_groups VALUES (6,@shared_iventors_gid);

INSERT INTO user_groups VALUES (7,1);
INSERT INTO user_groups VALUES (7,@shared_iventors_gid);

INSERT INTO user_groups VALUES (8,2);
INSERT INTO user_groups VALUES (9,3); -- grant organization admin role


INSERT INTO permissions (gid,resource,action)
    VALUES (1, 'ideas', 'READ_OWN, CREATE, EDIT_OWN, DELETE_OWN');

INSERT INTO permissions (gid,resource,action) VALUES (2, 'IDEAS', 'READ, EDIT, DELETE');
INSERT INTO permissions (uid,resource,resource_instance,action) VALUES (2, 'ideas', 1, 'READ');
INSERT INTO permissions (uid,resource,resource_instance,action) VALUES (2, 'IdEaS', 2, 'READ_OWN');

INSERT INTO ideas (id, organization_id, owner_uid, owner_gid, name, title)
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

INSERT INTO ideas VALUES (5, @emca, 5, null, 'idea1@emca', 'the 1st idea of inventor1@emca' );
INSERT INTO ideas VALUES (6, @emca, 5, null, 'idea2@emca', 'the 2nd idea of inventor1@emca' );
INSERT INTO ideas VALUES (7, @emca, 5, null, 'idea1@emca', 'the 1st idea of inventor2@emca' );
INSERT INTO ideas VALUES (8, @emca, 6, null, 'idea2@emca', 'the 2nd idea of inventor2@emca' );


INSERT INTO ideas VALUES (13, @emca, null, @shared_iventors_gid, 'shared-idea1@emca', 'the 1st shared idea at emca' );
INSERT INTO ideas VALUES (14, @emca, null, @shared_iventors_gid, 'shared-idea2@emca', 'the 2nd shared idea at emca' );

SET @DISABLE_TRIGGERS=1;
INSERT INTO ideas VALUES (15, @emca, null, null, 'orphan-idea1@emca', 'the 1st orphan idea at emca' );
INSERT INTO ideas VALUES (16, @emca, null, null, 'orphan-idea2@emca', 'the 2nd orphan idea at emca' );
SET @DISABLE_TRIGGERS=NULL;
