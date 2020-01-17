USE dbTest;

INSERT INTO organization VALUES (2, 'org2', 'org2@.com', 'org2 description');
INSERT INTO organization VALUES (3, 'org3', 'org3@.com', 'org3 description');

INSERT INTO user (id, organizationId, email, password) VALUES (1, 2, 'inventor1@org2', 'test');
INSERT INTO user (id, organizationId, email, password) VALUES (2, 2, 'inventor2@org2', 'test');
INSERT INTO user (id, organizationId, email, password) VALUES (3, 2, 'inventor_manager1@org2', 'test');
INSERT INTO user (id, organizationId, email, password) VALUES (4, 3, 'inventor1@org3', 'test');
INSERT INTO user (id, organizationId, email, password) VALUES (5, 3, 'inventor2@org3', 'test');
INSERT INTO user (id, organizationId, email, password) VALUES (6, 2, 'reviewer1@org2', 'test');
INSERT INTO user (id, organizationId, email, password) VALUES (7, 3, 'reviewer1@org3', 'test');
INSERT INTO user (id, organizationId, email, password) VALUES (8, 3, 'inventor_manager1@org3', 'test');
INSERT INTO user (id, organizationId, email, password) VALUES (9, 2, 'org_admin1@org2', 'test');
INSERT INTO user (id, organizationId, email, password) VALUES (10, 2, 'opus_admin1@org2', 'test');
INSERT INTO user (id, organizationId, email, password) VALUES (11, 2, 'inventor_shared1@org2', 'test');
INSERT INTO user (id, organizationId, email, password) VALUES (12, 3, 'inventor_shared1@org3', 'test');

-- [1,2,4,5] -> inventors; [3,8] -> managers; [6,7] -> reviewers; [1,4,11,12] -> inventors shared; [9] -> org admin; [10] -> opus admin
INSERT INTO users_groups VALUES (1, 1);
INSERT INTO users_groups VALUES (1, 6);
INSERT INTO users_groups VALUES (2, 1);
INSERT INTO users_groups VALUES (3, 2);
INSERT INTO users_groups VALUES (4, 1);
INSERT INTO users_groups VALUES (4, 6);
INSERT INTO users_groups VALUES (5, 1);
INSERT INTO users_groups VALUES (6, 4);
INSERT INTO users_groups VALUES (7, 4);
INSERT INTO users_groups VALUES (8, 2);
INSERT INTO users_groups VALUES (9, 5);
INSERT INTO users_groups VALUES (10, 3);
INSERT INTO users_groups VALUES (11, 6);
INSERT INTO users_groups VALUES (12, 6);

-- common ideas at org = 2
INSERT INTO user_idea (id, organizationId, ownerUserId, ownerGroupId, name) VALUES (1, 2, 1, null, 'idea1_user1@org2');
INSERT INTO user_idea (id, organizationId, ownerUserId, ownerGroupId, name) VALUES (2, 2, 1, null, 'idea2_user1@org2');
INSERT INTO user_idea (id, organizationId, ownerUserId, ownerGroupId, name) VALUES (3, 2, 2, null, 'idea1_user2@org2');
INSERT INTO user_idea (id, organizationId, ownerUserId, ownerGroupId, name) VALUES (4, 2, 2, null, 'idea2_user2@org2');
-- imported ideas assigned to inventor_manager group (id=2)
INSERT INTO user_idea (id, organizationId, ownerUserId, ownerGroupId, name, isImported) VALUES (5, 2, null, 2, 'sharedIdea5@org2', true);
INSERT INTO user_idea (id, organizationId, ownerUserId, ownerGroupId, name, isImported) VALUES (6, 2, null , 2, 'sharedIdea6@org2', true);
INSERT INTO user_idea (id, organizationId, ownerUserId, ownerGroupId, name, isImported) VALUES (7, 3, null, 2, 'sharedIdea7@org3', true);
-- common idea at org = 3
INSERT INTO user_idea (id, organizationId, ownerUserId, ownerGroupId, name) VALUES (8, 3, 4, null, 'idea1_user1@org3');

-- comments for shared idea (5) at 2nd organization
INSERT INTO comment (ownerUserId, userIdeaId, data) VALUES (6, 5, '1st comment by rewiewer1@org2 on the shared idea (5) at org2');
INSERT INTO comment (ownerUserId, userIdeaId, data) VALUES (1, 5, '2nd comment by inventor1@org2 on the shared idea (5) at org2');
INSERT INTO comment (ownerUserId, userIdeaId, data) VALUES (2, 5, '3rd comment by inventor2@org2 on the shared idea (5) at org2');
-- comment for shared idea (6) at 2nd organization
INSERT INTO comment (ownerUserId, userIdeaId, data) VALUES (6, 6, '1st comment by reviewer1@org2 on the shared idea (6) at org2');
-- comment for shared idea (7) at 3rd organization
INSERT INTO comment (ownerUserId, userIdeaId, data) VALUES (4, 7, '1st comment by inventor1@org3 on the shared idea (7) at org3');

-- org2 permission for 5, 6 ideas for inventors and reviewers (groupId 6, 4)
INSERT INTO permission (resourceId, groupId, resource, actions, organizationId) VALUES (5, 6, 'user_idea', 'READ,EDIT,READ-COMMENT,CREATE-COMMENT', 2);
INSERT INTO permission (resourceId, groupId, resource, actions, organizationId) VALUES (5, 4, 'user_idea', 'READ,READ-COMMENT,CREATE-COMMENT', 2);
INSERT INTO permission (resourceId, groupId, resource, actions, organizationId) VALUES (6, 6, 'user_idea', 'READ,EDIT,READ-COMMENT,CREATE-COMMENT', 2);
INSERT INTO permission (resourceId, groupId, resource, actions, organizationId) VALUES (6, 4, 'user_idea', 'READ,READ-COMMENT,CREATE-COMMENT', 2);
-- org3 permission for 7th idea for reviewers (groupId 6, 4)
INSERT INTO permission (resourceId, groupId, resource, actions, organizationId) VALUES (7, 6, 'user_idea', 'READ,EDIT,READ-COMMENT,CREATE-COMMENT', 3);
INSERT INTO permission (resourceId, groupId, resource, actions, organizationId) VALUES (7, 4, 'user_idea', 'READ,READ-COMMENT,CREATE-COMMENT', 3);
-- org2 permission for inventor manager to READ inventor_shared and reviewer groups
INSERT INTO permission (resourceId, userId, resource, actions, organizationId) VALUES (4, 3, 'group', 'READ', 2);
INSERT INTO permission (resourceId, userId, resource, actions, organizationId) VALUES (6, 3, 'group', 'READ', 2);
