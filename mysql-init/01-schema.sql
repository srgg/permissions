SET NAMES utf8mb4;
# SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE organizations (
    id            INT AUTO_INCREMENT,
    name          VARCHAR(100),
    domain        VARCHAR(50),
    CONSTRAINT pk_organizations PRIMARY KEY (id)
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
CREATE UNIQUE INDEX idx_organizations_name ON organizations (name);
CREATE UNIQUE INDEX idx_organizations_domain ON organizations (domain);

CREATE TABLE users (
  id                INT AUTO_INCREMENT,
  organization_id   INT,
  name              VARCHAR(100),
  password          VARCHAR(100),
  password_salt     VARCHAR(100),
  CONSTRAINT pk_users PRIMARY KEY (id),
  CONSTRAINT users_fk01 FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
CREATE UNIQUE INDEX idx_users_username ON users (organization_id, name);


CREATE TABLE groups (
  id                INT AUTO_INCREMENT,
  organization_id   INT,
  parent_gid        INT DEFAULT NULL,
  name              VARCHAR(100) NOT NULL,
  description       VARCHAR(512),
  CONSTRAINT pk_groups PRIMARY KEY (id),
  CONSTRAINT groups_fk01 FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT groups_fk02 FOREIGN KEY (parent_gid) REFERENCES groups (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
CREATE UNIQUE INDEX idx_groups_name ON groups (organization_id, name);


CREATE TABLE user_groups (
  uid   INT NOT NULL,
  gid   INT NOT NULL,
  CONSTRAINT pk_user_groups PRIMARY KEY (uid, gid),
  CONSTRAINT usergroups_fk01 FOREIGN KEY (uid) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT usergroups_fk02 FOREIGN KEY (gid) REFERENCES groups (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;

CREATE TABLE permissions (
  id         INT AUTO_INCREMENT,
  gid  INT,
  uid  INT,
  resource VARCHAR(100),
  resource_instance INT,
  action   VARCHAR(100),
  CHECK ((gid IS NOT NULL AND uid IS NULL) OR (gid IS NULL AND uid IS NOT NULL)),
  CHECK (action IS NOT NULL OR resource IS NOT NULL ),
  CHECK (resource_instance IS NULL OR resource IS NOT NULL), -- Resource should be set if resource instance is provided
  CONSTRAINT pk_permissions PRIMARY KEY (id),
  CONSTRAINT permissions_fk01 FOREIGN KEY (gid) REFERENCES groups (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT permissions_fk02 FOREIGN KEY (uid) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;

CREATE UNIQUE INDEX idx_permissions_01 ON permissions (gid, resource, resource_instance);
CREATE UNIQUE INDEX idx_permissions_02 ON permissions (uid, resource, resource_instance);


CREATE TABLE ideas (
  id            INT AUTO_INCREMENT,
  organization_id   INT NOT NULL,
  owner_uid      INT,
  owner_gid INT,
  name          VARCHAR(100),
  title         VARCHAR(100),
  CONSTRAINT pk_ideas PRIMARY KEY (id),
  CONSTRAINT ideas_fk01 FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT ideas_fk02 FOREIGN KEY (owner_uid) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT ideas_fk03 FOREIGN KEY (owner_gid) REFERENCES groups (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;

CREATE TABLE idea_comments (
  id            INT AUTO_INCREMENT,
  owner_uid     INT,
  owner_gid     INT,
  ideas_id       INT,
  text          VARCHAR(512),
  CHECK (owner_gid IS NULL ), # group ownership is not supported for comments
  CONSTRAINT pk_comments PRIMARY KEY (id),
  CONSTRAINT comments_fk01 FOREIGN KEY (owner_uid) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT comments_fk02 FOREIGN KEY (ideas_id) REFERENCES ideas (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;

-- In order to prevent useless organization_id duplication in comments
CREATE VIEW comments AS SELECT c.*, i.organization_id FROM idea_comments c join ideas i on c.ideas_id = i.id;

DELIMITER $$

CREATE FUNCTION triggersEnabled() RETURNS BOOL
BEGIN
    IF @DISABLE_TRIGGERS = 1 THEN
        return FALSE;
    ELSE
        return TRUE;
    END IF;
END; $$

CREATE FUNCTION calculatePermittedActions(isOwner BOOL, permissionList VARCHAR(255)) RETURNS VARCHAR(512)
BEGIN
    DECLARE permissions VARCHAR(512);

    (SELECT GROUP_CONCAT(DISTINCT p.single_perm ORDER BY p.single_perm) INTO permissions FROM
        (
            SELECT Trim(SUBSTRING_INDEX(SUBSTRING_INDEX(ppp.action, ',', n.digit+1), ',', -1)) single_perm
            FROM (
                     SELECT * FROM permissions pp
                     WHERE  FIND_IN_SET(pp.id, permissionList)
                 ) ppp
                     INNER JOIN (SELECT 0 digit UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) n
                                ON LENGTH(REPLACE(ppp.action, ',' , '')) <= LENGTH(ppp.action)-n.digit
        )p
     WHERE isOwner OR (NOT isOwner AND RIGHT(LCASE(p.single_perm), 4) <> '_own'));

    RETURN permissions;
END; $$

CREATE FUNCTION calculatePermittedActionsOrNull(requestedAction VARCHAR(100), isOwner BOOL, permissionList VARCHAR(255)) RETURNS VARCHAR(512)
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
END; $$

CREATE PROCEDURE checkConsistencyWithinOrganization(organization_id INT, owner_uid INT, owner_gid INT)
BEGIN
    IF owner_uid IS NULL AND owner_gid IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot add or update row: owner_uid and owner_gid can not be null in the same time.';
    END IF;

    IF organization_id IS NULL THEN
        IF owner_uid IS NULL OR owner_gid IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Cannot add or update row: owner_uid and owner_gid can not be null.';
        END IF;

        SET organization_id = (SELECT u.organization_id FROM users u where u.id= owner_uid);
    END IF;

    IF owner_uid IS NOT NULL THEN
        SET @user_org_id  = (SELECT u.organization_id FROM users u where u.id= owner_uid);

        IF @user_org_id <> organization_id THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Cannot add or update row: user organization mismatch.';
        END IF;
    END IF;

    IF owner_gid IS NOT NULL THEN
        SET @groups_org_id  = (SELECT r.organization_id FROM groups r where r.id= owner_gid);

        IF @groups_org_id <> organization_id AND @groups_org_id <> 1 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Cannot add or update row: group organization mismatch.';
        END IF;
    END IF;
END; $$

CREATE TRIGGER user_groups_insert BEFORE INSERT ON user_groups FOR EACH ROW
BEGIN
    IF triggersEnabled() THEN
        call checkConsistencyWithinOrganization(null, New.uid, NEW.gid);
    END IF;
END; $$

CREATE TRIGGER user_groups_update BEFORE UPDATE ON user_groups FOR EACH ROW
BEGIN
    IF triggersEnabled() THEN
        call checkConsistencyWithinOrganization(null, New.uid, NEW.gid);
    END IF;
END; $$

CREATE TRIGGER ideas_insert BEFORE INSERT ON ideas FOR EACH ROW
BEGIN
    IF triggersEnabled() THEN
        call checkConsistencyWithinOrganization(NEW.organization_id, NEW.owner_uid, NEW.owner_gid);
    END IF;
END; $$

CREATE TRIGGER ideas_update BEFORE UPDATE ON ideas FOR EACH ROW
BEGIN
    IF triggersEnabled() THEN
        call checkConsistencyWithinOrganization(NEW.organization_id, NEW.owner_uid, NEW.owner_gid);
    END IF;
END; $$

CREATE TRIGGER groups_insert BEFORE INSERT ON groups FOR EACH ROW
BEGIN
    IF triggersEnabled() THEN
        IF NEW.parent_gid IS NOT NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Group hierarchy is not supported, parent_gid MUST be NULL!';
        END IF;
    END IF;
END; $$

CREATE TRIGGER groups_update BEFORE UPDATE ON groups FOR EACH ROW
BEGIN
    IF triggersEnabled() THEN
        IF NEW.parent_gid IS NOT NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Group hierarchy is not supported, parent_gid MUST be NULL!';
        END IF;
    END IF;
END; $$

DELIMITER ;
