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
  name              VARCHAR(100) NOT NULL,
  description       VARCHAR(512),
  CONSTRAINT pk_groups PRIMARY KEY (id),
  CONSTRAINT groups_fk01 FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
CREATE UNIQUE INDEX idx_groups_name ON groups (organization_id, name);


CREATE TABLE user_groups (
  user_id   INT NOT NULL,
  group_id   INT NOT NULL,
  CONSTRAINT pk_user_groups PRIMARY KEY (user_id, group_id),
  CONSTRAINT usergroups_fk01 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT usergroups_fk02 FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;

CREATE TABLE permissions (
  id         INT AUTO_INCREMENT,
  group_id  INT,
  user_id  INT,
  resource VARCHAR(100),
  resource_instance INT,
  action   VARCHAR(100),
  CHECK ((group_id IS NOT NULL AND user_id IS NULL) OR (group_id IS NULL AND user_id IS NOT NULL)),
  CHECK (action IS NOT NULL OR resource IS NOT NULL ),
  CHECK (resource_instance IS NULL OR resource IS NOT NULL), -- Resource should be set if resource instance is provided
  CONSTRAINT pk_permissions PRIMARY KEY (id),
  CONSTRAINT permissions_fk01 FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT permissions_fk02 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;

CREATE UNIQUE INDEX idx_permissions_01 ON permissions (group_id, resource, resource_instance);
CREATE UNIQUE INDEX idx_permissions_02 ON permissions (user_id, resource, resource_instance);


CREATE TABLE ideas (
  id            INT AUTO_INCREMENT,
  organization_id   INT NOT NULL,
  owner_id      INT,
  owner_group_id INT,
  name          VARCHAR(100),
  title         VARCHAR(100),
  CONSTRAINT pk_ideas PRIMARY KEY (id),
  CONSTRAINT ideas_fk01 FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT ideas_fk02 FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT ideas_fk03 FOREIGN KEY (owner_group_id) REFERENCES groups (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;

DELIMITER $$

CREATE FUNCTION calcPermissions(permissionList VARCHAR(255)) RETURNS VARCHAR(255)
BEGIN
    DECLARE permissions VARCHAR(255);

    (SELECT GROUP_CONCAT(DISTINCT REPLACE(p.single_perm, '_OWN', '') ORDER BY p.single_perm) INTO permissions FROM
        (
            SELECT Trim(SUBSTRING_INDEX(SUBSTRING_INDEX(ppp.action, ',', n.digit+1), ',', -1)) single_perm
            FROM (
                     SELECT * FROM permissions pp
                     WHERE  FIND_IN_SET(pp.id, permissionList)
                 ) ppp
                     INNER JOIN (SELECT 0 digit UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) n
                                ON LENGTH(REPLACE(ppp.action, ',' , '')) <= LENGTH(ppp.action)-n.digit
        )p );

    return permissions;
END; $$

CREATE PROCEDURE checkConsistencyWithinOrganization(organization_id INT, owner_uid INT, owner_gid INT)
BEGIN
    IF owner_uid IS NULL AND owner_gid IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot add or update row: owner_id and owner_group_id can not be null in the same time.';
    END IF;

    IF organization_id IS NULL THEN
        IF owner_uid IS NULL OR owner_gid IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Cannot add or update row: owner_id and owner_group_id can not be null.';
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
    IF @DISABLE_TRIGGERS <> 1 THEN
        call checkConsistencyWithinOrganization(null, New.user_id, NEW.group_id);
    END IF;
END; $$

CREATE TRIGGER user_groups_update BEFORE UPDATE ON user_groups FOR EACH ROW
BEGIN
    IF @DISABLE_TRIGGERS <> 1 THEN
        call checkConsistencyWithinOrganization(null, New.user_id, NEW.group_id);
    END IF;
END; $$

CREATE TRIGGER ideas_insert BEFORE INSERT ON ideas FOR EACH ROW
BEGIN
    IF @DISABLE_TRIGGERS <> 1 THEN
        call checkConsistencyWithinOrganization(NEW.organization_id, NEW.owner_id, NEW.owner_group_id);
    END IF;
END; $$

CREATE TRIGGER ideas_update BEFORE UPDATE ON ideas FOR EACH ROW
BEGIN
    IF @DISABLE_TRIGGERS <> 1 THEN
        call checkConsistencyWithinOrganization(NEW.organization_id, NEW.owner_id, NEW.owner_group_id);
    END IF;
END; $$

DELIMITER ;
