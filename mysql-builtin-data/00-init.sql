USE dbTest;
--
-- CREATE TABLE organizations (
--     id            INT AUTO_INCREMENT,
--     name          VARCHAR(100),
--     domain        VARCHAR(50),
--     CONSTRAINT pk_organizations PRIMARY KEY (id)
-- ) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
-- CREATE UNIQUE INDEX idx_organizations_name ON organizations (name);
-- CREATE UNIQUE INDEX idx_organizations_domain ON organizations (domain);
--
-- CREATE TABLE users (
--   id                INT AUTO_INCREMENT,
--   organizationId   INT,
--   name              VARCHAR(100),
--   password          VARCHAR(100),
--   password_salt     VARCHAR(100),
--   CONSTRAINT pk_users PRIMARY KEY (id),
--   CONSTRAINT users_fk01 FOREIGN KEY (organizationId) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION
-- ) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
-- CREATE UNIQUE INDEX idx_users_username ON users (organizationId, name);
--
--
-- CREATE TABLE groups (
--   id                INT AUTO_INCREMENT,
--   organizationId   INT,
--   parent_groupId        INT DEFAULT NULL,
--   name              VARCHAR(100) NOT NULL,
--   description       VARCHAR(512),
--   CONSTRAINT pk_groups PRIMARY KEY (id),
--   CONSTRAINT groups_fk01 FOREIGN KEY (organizationId) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
--   CONSTRAINT groups_fk02 FOREIGN KEY (parent_groupId) REFERENCES groups (id) ON DELETE NO ACTION ON UPDATE NO ACTION
-- ) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
-- CREATE UNIQUE INDEX idx_groups_name ON groups (organizationId, name);
--
--
-- CREATE TABLE user_groups (
--   userId   INT NOT NULL,
--   groupId   INT NOT NULL,
--   CONSTRAINT pk_user_groups PRIMARY KEY (userId, groupId),
--   CONSTRAINT usergroups_fk01 FOREIGN KEY (userId) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
--   CONSTRAINT usergroups_fk02 FOREIGN KEY (groupId) REFERENCES groups (id) ON DELETE NO ACTION ON UPDATE NO ACTION
-- ) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
--
-- CREATE TABLE permissions (
--   id         INT AUTO_INCREMENT,
--   organization_id INT NOT NULL,
--   groupId  INT,
--   userId  INT,
--   domain VARCHAR(100),
--   resource_instance INT,
--   action   VARCHAR(100),
--   CHECK ((groupId IS NOT NULL AND userId IS NULL) OR (groupId IS NULL AND userId IS NOT NULL)),
--   CHECK (action IS NOT NULL OR domain IS NOT NULL ),
--   CHECK (resource_instance IS NULL OR domain IS NOT NULL), -- Resource should be set if domain instance is provided
--   CONSTRAINT pk_permissions PRIMARY KEY (id),
--   CONSTRAINT permissions_fk01 FOREIGN KEY (groupId) REFERENCES groups (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
--   CONSTRAINT permissions_fk02 FOREIGN KEY (userId) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
--   CONSTRAINT permissions_fk03 FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION
-- ) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
--
-- CREATE UNIQUE INDEX idx_permissions_01 ON permissions (groupId, domain, resource_instance);
-- CREATE UNIQUE INDEX idx_permissions_02 ON permissions (userId, domain, resource_instance);
--
--
-- CREATE TABLE ideas (
--   id            INT AUTO_INCREMENT,
--   organizationId   INT NOT NULL,
--   ownerUserId      INT,
--   ownerGroupId INT,
--   name          VARCHAR(100),
--   title         VARCHAR(100),
--   CONSTRAINT pk_ideas PRIMARY KEY (id),
--   CONSTRAINT ideas_fk01 FOREIGN KEY (organizationId) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
--   CONSTRAINT ideas_fk02 FOREIGN KEY (ownerUserId) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
--   CONSTRAINT ideas_fk03 FOREIGN KEY (ownerGroupId) REFERENCES groups (id) ON DELETE NO ACTION ON UPDATE NO ACTION
-- ) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
--
-- CREATE TABLE idea_comments (
--   id            INT AUTO_INCREMENT,
--   ownerUserId     INT,
--   ownerGroupId     INT,
--   ideas_id       INT,
--   text          VARCHAR(512),
--   CHECK (ownerGroupId IS NULL ), # group ownership is not supported for comments
--   CONSTRAINT pk_comments PRIMARY KEY (id),
--   CONSTRAINT comments_fk01 FOREIGN KEY (ownerUserId) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
--   CONSTRAINT comments_fk02 FOREIGN KEY (ideas_id) REFERENCES ideas (id) ON DELETE NO ACTION ON UPDATE NO ACTION
-- ) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
--

-- In order to prevent useless organizationId duplication in comments
-- CREATE VIEW comment AS SELECT c.*, i.organizationId FROM idea_comments c join ideas i on c.ideas_id = i.id;

CREATE FUNCTION triggersEnabled()
  RETURNS BOOL
  BEGIN
    IF @DISABLE_TRIGGERS = 1
    THEN
      return FALSE;
    ELSE
      return TRUE;
    END IF;
  END;

CREATE FUNCTION calculatePermittedActions(isOwner BOOL, permissionList VARCHAR(255)) RETURNS VARCHAR(512)
 BEGIN
    DECLARE permissions VARCHAR(512);

    (SELECT GROUP_CONCAT(DISTINCT p.single_perm ORDER BY p.single_perm) INTO permissions FROM
        (
            SELECT Trim(SUBSTRING_INDEX(SUBSTRING_INDEX(ppp.actions, ',', n.digit+1), ',', -1)) single_perm
            FROM (
                     SELECT * FROM permission pp
                     WHERE  FIND_IN_SET(pp.id, permissionList)
                 ) ppp
                     INNER JOIN (SELECT 0 digit UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) n
                                ON LENGTH(REPLACE(ppp.actions, ',' , '')) <= LENGTH(ppp.actions)-n.digit
        )p
     WHERE isOwner OR ((isOwner IS NULL OR NOT isOwner) AND RIGHT(LCASE(p.single_perm), 4) <> '_own'));

    RETURN permissions;
 END;

CREATE FUNCTION calculatePermittedActionsOrNull(requestedAction VARCHAR(100), isOwner BOOL, permissionList VARCHAR(255))
  RETURNS VARCHAR(512)
  BEGIN
    DECLARE permissions VARCHAR(512);
    SELECT calculatePermittedActions(isOwner, permissionList) INTO permissions;

    -- ensure that requested action is permitted
    IF FIND_IN_SET(LCASE(requestedAction), permissions) > 0 OR (
            isOwner AND (FIND_IN_SET(LCASE(CONCAT(requestedAction, '_OWN')),  permissions) > 0)
        ) THEN
            #return REPLACE(permissions, '_OWN', '');
        RETURN permissions;
    ELSE
      RETURN NULL;
    END IF;
  END;

CREATE PROCEDURE checkConsistencyWithinOrganization(organizationId INT, ownerUserId INT, ownerGroupId INT)
  BEGIN
    IF ownerUserId IS NULL AND ownerGroupId IS NULL
    THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot add or update row: ownerUserId and ownerGroupId can not be null in the same time.';
    END IF;

    IF organizationId IS NULL
    THEN
      IF ownerUserId IS NULL OR ownerGroupId IS NULL
      THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot add or update row: ownerUserId and ownerGroupId can not be null.';
      END IF;

      SET organizationId = (SELECT u.organizationId
                            FROM user u
                            where u.id = ownerUserId);
    END IF;

    IF ownerUserId IS NOT NULL
    THEN
      SET @user_org_id = (SELECT u.organizationId
                          FROM user u
                          where u.id = ownerUserId);

      IF @user_org_id <> organizationId
      THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot add or update row: user organization mismatch.';
      END IF;
    END IF;

    IF ownerGroupId IS NOT NULL
    THEN
      SET @groups_org_id = (SELECT r.organizationId
                            FROM `dbTest`.group r
                            where r.id = ownerGroupId);

      IF @groups_org_id <> organizationId AND @groups_org_id <> 1
      THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot add or update row: edison.group organization mismatch.';
      END IF;
    END IF;
  END;

CREATE TRIGGER user_groups_insert
  BEFORE INSERT
  ON users_groups
  FOR EACH ROW
  BEGIN
    IF triggersEnabled()
    THEN
      call checkConsistencyWithinOrganization(null, New.userId, New.groupId);
    END IF;
  END;

CREATE TRIGGER user_groups_update
  BEFORE UPDATE
  ON users_groups
  FOR EACH ROW
  BEGIN
    IF triggersEnabled()
    THEN
      call checkConsistencyWithinOrganization(null, New.userId, New.groupId);
    END IF;
  END;

CREATE TRIGGER ideas_insert
  BEFORE INSERT
  ON user_idea
  FOR EACH ROW
  BEGIN
    IF triggersEnabled()
    THEN
      call checkConsistencyWithinOrganization(NEW.organizationId, NEW.ownerUserId, NEW.ownerGroupId);
    END IF;
  END;

CREATE TRIGGER ideas_update
  BEFORE UPDATE
  ON user_idea
  FOR EACH ROW
  BEGIN
    IF triggersEnabled()
    THEN
      call checkConsistencyWithinOrganization(NEW.organizationId, NEW.ownerUserId, NEW.ownerGroupId);
    END IF;
  END;

CREATE FUNCTION getOrganizationIDForGidOrUid(oid INT, gid INT, uid INT) RETURNS INT
BEGIN
    DECLARE org_id INT;

    IF gid IS NOT NULL THEN
        SELECT g.organizationId FROM `group` g WHERE g.id = gid AND organizationId != 1 INTO org_id;
    ELSE
        IF uid IS NOT NULL THEN
            SET org_id  = (SELECT u.organizationId FROM user u where u.id = uid);
        ELSE
            SET org_id = NULL;
        END IF;
    END IF;

    IF oid IS NOT NULL THEN
        IF org_id IS NOT NULL THEN
            -- kinda just in case check
            IF org_id != oid THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Cannot add or update row: user organization mismatch.';
            END IF;
        END IF;

        RETURN oid;
    END IF;

    RETURN org_id;
END;

CREATE TRIGGER permissions_insert BEFORE INSERT ON permission FOR EACH ROW
BEGIN
    DECLARE oid INT;

    IF triggersEnabled() THEN
        SELECT getOrganizationIDForGidOrUid(NEW.organizationId, NEW.groupId, NEW.userId) INTO oid;
        SET NEW.organizationId = oid;
    END IF;
END;

CREATE TRIGGER permissions_update BEFORE INSERT ON permission FOR EACH ROW
BEGIN
    DECLARE oid INT;

    IF triggersEnabled() THEN
        SELECT getOrganizationIDForGidOrUid(NEW.organizationId, NEW.groupId, NEW.userId) INTO oid;
        SET NEW.organizationId = oid;
    END IF;
END;
