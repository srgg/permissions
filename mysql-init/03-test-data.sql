#SET sql_mode=(SELECT CONCAT(@@sql_mode,',NO_AUTO_VALUE_ON_ZERO'));

-- Platform admin

/*
   PLATFORM ADMIN USERS MUST NOT BELONG TO A SHARED ORGANIZATION (THE ONE WITH ID '1'),
   they MUST belong to a separate organization

   That will prevent listing  Platform Admins
   in the results returned by 'read all users'executed from any other organization
*/
SET @plat_oid = 4;
INSERT INTO organizations (id, name, domain)
VALUES (@plat_oid, 'PLATFORM', 'paltform.com');

SET @platform_admin_uid = 128;
INSERT INTO users
VALUES (@platform_admin_uid, @plat_oid, 'platform-admin@platform', 'pw2', 'salt2');

SELECT id
INTO @platform_admin_gid
FROM groups
WHERE name = 'platform admin';

INSERT INTO user_groups
VALUES (@platform_admin_uid, @platform_admin_gid);

--
SET @acme = 2;
INSERT INTO organizations (id, name, domain)
VALUES (@acme, 'ACME', 'acme.com');

SET @emca = 3;
INSERT INTO organizations (id, name, domain)
VALUES (@emca, 'EMCA', 'emca.com');

INSERT INTO users
VALUES (1, @acme, 'inventor1@acme', 'pw1', 'salt1');
INSERT INTO users
VALUES (2, @acme, 'inventor2@acme', 'pw2', 'salt2');
INSERT INTO users
VALUES (3, @acme, 'inventor3@acme', 'pw3', 'salt3');
INSERT INTO users
VALUES (4, @acme, 'manager@acme', 'pw4', 'salt4');

SET @inventor1_emca = 5;
INSERT INTO users
VALUES (@inventor1_emca, @emca, 'inventor1@emca', 'pw1', 'salt1');
SET @inventor2_emca = 6;
INSERT INTO users
VALUES (@inventor2_emca, @emca, 'inventor2@emca', 'pw2', 'salt2');
INSERT INTO users
VALUES (7, @emca, 'inventor3@emca', 'pw3', 'salt3');
INSERT INTO users
VALUES (8, @emca, 'manager@emca', 'pw4', 'salt4');
INSERT INTO users
VALUES (9, @emca, 'admin@emca', 'pw5', 'salt5');


-- Shared Idea Inventors
SET @shared_ideas_gid = 111;
INSERT INTO groups (id, organizationId, name, description)
VALUES (@shared_ideas_gid, @emca, 'shared-ideas', 'Group includes all the imported/shared ideas.');

SET @shared_iventors_gid = 100;
INSERT INTO groups (id, organizationId, name, description)
VALUES (@shared_iventors_gid, @emca, 'shared-idea-inventors', 'Inventors that can work with shared ideas');
-- INSERT INTO permissions (gid,resource,action) VALUES (@shared_iventors_gid, 'IdEaS', 'READ_OWN, READ_SHARED_OWN, EDIT_SHARED_OWN');

INSERT INTO user_groups
VALUES (1, 1);
INSERT INTO user_groups
VALUES (2, 1);
INSERT INTO user_groups
VALUES (3, 1);
INSERT INTO user_groups
VALUES (4, 2);

INSERT INTO user_groups
VALUES (@inventor1_emca, 1);
INSERT INTO user_groups
VALUES (@inventor1_emca, @shared_iventors_gid);

INSERT INTO user_groups
VALUES (6, 1);
INSERT INTO user_groups
VALUES (6, @shared_iventors_gid);

INSERT INTO user_groups
VALUES (7, 1);
INSERT INTO user_groups
VALUES (7, @shared_iventors_gid);

INSERT INTO user_groups
VALUES (8, 2);
INSERT INTO user_groups
VALUES (9, 3); -- grant organization admin role


call shareResourceToUser(2, 'User_idea', 1, 'READ');
call shareResourceToUser(2, 'UsEr_IdEa', 2, 'READ_OWN');

INSERT INTO ideas (id, organizationId, ownerUserId, ownerGroupId, name, title)
VALUES (1, @acme, 1, null, 'idea1@acme', 'the 1st idea of inventor1@acme');

INSERT INTO ideas
VALUES (2, @acme, 1, null, 'idea2@acme', 'the 2nd idea of inventor1@acme');
INSERT INTO ideas
VALUES (3, @acme, 2, null, 'idea1@acme', 'the 1st idea of inventor2@acme');
INSERT INTO ideas
VALUES (4, @acme, 2, null, 'idea2@acme', 'the 2nd idea of inventor2@acme');

INSERT INTO ideas
VALUES (9, @acme, null, 1, 'shared-idea1@acme', 'the 1st shared idea at acme');
INSERT INTO ideas
VALUES (10, @acme, null, 1, 'shared-idea2@acme', 'the 2nd shared idea at acme');

SET @DISABLE_TRIGGERS=1;
INSERT INTO ideas VALUES (11, @acme, null, null, 'orphan-idea1@acme', 'the 1st orphan idea at acme' );
INSERT INTO ideas VALUES (12, @acme, null, null, 'orphan-idea2@acme', 'the 2nd orphan idea at acme' );
SET @DISABLE_TRIGGERS=NULL;

INSERT INTO ideas VALUES (5, @emca, @inventor1_emca, null, 'idea1@emca', 'the 1st idea of inventor1@emca' );
INSERT INTO ideas VALUES (6, @emca, @inventor1_emca, null, 'idea2@emca', 'the 2nd idea of inventor1@emca' );
INSERT INTO ideas VALUES (7, @emca, 6, null, 'idea1@emca', 'the 1st idea of inventor2@emca' );
INSERT INTO ideas VALUES (8, @emca, 6, null, 'idea2@emca', 'the 2nd idea of inventor2@emca' );


-- INSERT INTO ideas VALUES (13, @emca, null, @shared_iventors_gid, 'shared-idea1@emca', 'the 1st shared idea at emca' );
-- INSERT INTO ideas VALUES (14, @emca, null, @shared_iventors_gid, 'shared-idea2@emca', 'the 2nd shared idea at emca' );
SET @ideaManager_gid = 2;
INSERT INTO ideas
VALUES (13, @emca, null, @ideaManager_gid, 'shared-idea1@emca', 'the 1st shared idea at emca');
INSERT INTO ideas
VALUES (14, @emca, null, @ideaManager_gid, 'shared-idea2@emca', 'the 2nd shared idea at emca');

/*
    shared-inventors group is not a built in one,
    therefore it is not necessary to provide organization_id. It will be calculated automatically.
*/
call shareResourceToGroup(null, @shared_iventors_gid, 'user_idea', 13,
                          'READ,READ_SHARED, EDIT_SHARED, READ-COMMENT_SHARED');
call shareResourceToGroup(null, @shared_iventors_gid, 'user_idea', 14,
                          'READ,READ_SHARED, EDIT_SHARED, READ-COMMENT_SHARED');


SET @DISABLE_TRIGGERS = 1;
INSERT INTO ideas
VALUES (15, @emca, null, null, 'orphan-idea1@emca', 'the 1st orphan idea at emca');
INSERT INTO ideas
VALUES (16, @emca, null, null, 'orphan-idea2@emca', 'the 2nd orphan idea at emca');
SET @DISABLE_TRIGGERS = NULL;


call shareResourceToUser(@inventor1_emca, 'user_idea', 7, 'READ,READ-COMMENT_SHARED,EDIT');
call shareResourceToUser(@inventor1_emca, 'user_IdEa', 8, 'READ_OWN, READ-COMMENT_SHARED_OWN,EDIT_OWN');


-- --------------------
-- Comments and idea reviewers
-- -------------------

-- Reviewers
-- SET @reveiwers_gid = 101;
-- INSERT INTO groups  (id, organization_id, name, description) VALUES (@reveiwers_gid, @emca, 'idea-reviewers', 'Supervisors that can read the entire idea  and can commented on it');
-- INSERT INTO permissions (gid,resource,action) VALUES (@reveiwers_gid, 'Comments', 'DELETE_OWN, EDIT_OWN');
-- INSERT INTO permissions (gid,resource,action) VALUES (@reveiwers_gid, 'Ideas', 'READ');

-- #####################################
--  COMMENTS
-- ####################################
SET @idea_reviwer_gid = (SELECT id
                         FROM groups
                         WHERE name = 'idea-reviewer');


-- -----------------------------------
-- ACME
-- ----------------------------------

/*
    Since `idea-reviewer` is a built in group - it is required to provide a correspondent organization id
 */
call shareResourceToGroup((SELECT organizationId
                           FROM ideas
                           WHERE id = 9), @idea_reviwer_gid, 'user_idea', 9, 'READ,READ_SHARED');
call shareResourceToGroup((SELECT organizationId
                           FROM ideas
                           WHERE id = 10), @idea_reviwer_gid, 'user_idea', 10, 'READ,READ_SHARED');

INSERT INTO users (organizationId, name, password, password_salt)
VALUES (@acme, 'reviewer1@acme', 'pw6', 'salt6');
SET @reviewer1 = LAST_INSERT_ID();
INSERT INTO user_groups
VALUES (@reviewer1, @idea_reviwer_gid);

INSERT INTO users (organizationId, name, password, password_salt)
VALUES (@acme, 'reviewer2@acme', 'pw7', 'salt7');
SET @reviewer2 = LAST_INSERT_ID();
INSERT INTO user_groups
vALUES (@reviewer2, @idea_reviwer_gid);

-- Create comments
INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@reviewer1, 9, '1st comment by rewiewer1@acme on the 1st shared idea at acme');
INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@reviewer1, 10, '1st comment by rewiewer1@acme on the 2nd shared idea at acme');

INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@reviewer2, 9, '1st comment by rewiewer2@acme on the 1st shared idea at acme');
INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@reviewer2, 10, '1st comment by rewiewer2@acme on the 2nd shared idea at acme');

INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (1, 9, '1st comment by inventor1@acme on the 1st shared idea at acme');
INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (1, 10, '1st comment by inventor1@acme on the 2nd shared idea at acme');


-- -----------------------------------
-- EMCA
-- ----------------------------------

/*
    Since `idea-reviewer` is a built in group - it is required to provide a correspondent organization id
 */

call shareResourceToGroup((SELECT organizationId
                           FROM ideas
                           WHERE id = 13), @idea_reviwer_gid, 'user_idea', 13, 'READ,READ_SHARED,READ-COMMENT_SHARED');
call shareResourceToGroup((SELECT organizationId
                           FROM ideas
                           WHERE id = 14), @idea_reviwer_gid, 'user_idea', 14, 'READ,READ_SHARED, READ-COMMENT_SHARED');

--  Grant Permissions to shared ideas
INSERT INTO users (organizationId, name, password, password_salt)
VALUES (@emca, 'reviewer1@emca', 'pw6', 'salt6');
SET @reviewer1 = LAST_INSERT_ID();
INSERT INTO user_groups
VALUES (@reviewer1, @idea_reviwer_gid);

INSERT INTO users (organizationId, name, password, password_salt)
VALUES (@emca, 'reviewer2@emca', 'pw7', 'salt7');
SET @reviewer2 = LAST_INSERT_ID();
INSERT INTO user_groups
vALUES (@reviewer2, @idea_reviwer_gid);

-- Create comments
INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@reviewer1, 13, '1st comment by rewiewer1@emca on the 1st shared idea at emca');
INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@reviewer1, 14, '1st comment by rewiewer1@emca on the 2nd shared idea at emca');

INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@reviewer2, 13, '1st comment by rewiewer2@emca on the 1st shared idea at emca');
INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@reviewer2, 14, '1st comment by rewiewer2@emca on the 2nd shared idea at emca');

INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@inventor1_emca, 13, '1st comment by inventor1@emca on the 1st shared idea at emca');
INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@inventor1_emca, 14, '1st comment by inventor1@emca on the 2nd shared idea at emca');

INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@inventor1_emca, 7, '1st comment by inventor1@emca on the 1st idea of inventor2@emca');
INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@inventor1_emca, 8, '1st comment by inventor1@emca on the 2nd idea of inventor2@emca');

INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@inventor2_emca, 7, '1st comment by inventor2@emca on the 1st idea of inventor2@emca');
INSERT INTO comments (ownerUserId, userIdeaId, data)
VALUES (@inventor2_emca, 8, '1st comment by inventor2@emca on the 2nd idea of inventor2@emca');
