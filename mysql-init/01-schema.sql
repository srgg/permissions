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


CREATE TABLE roles (
  id                INT AUTO_INCREMENT,
  organization_id   INT,
  name              VARCHAR(100) NOT NULL,
  description       VARCHAR(512),
  CONSTRAINT pk_roles_permissions PRIMARY KEY (id),
  CONSTRAINT roless_fk01 FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
CREATE UNIQUE INDEX idx_roles_name ON roles (organization_id, name);


CREATE TABLE user_roles (
  user_id   INT NOT NULL,
  role_id   INT NOT NULL,
  CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id),
  CONSTRAINT userroles_fk01 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT userroles_fk02 FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;

CREATE TABLE permissions (
  id         INT AUTO_INCREMENT,
  role_id  INT,
  user_id  INT,
  resource VARCHAR(100),
  resource_instance INT,
  action   VARCHAR(100),
  CHECK ((role_id IS NOT NULL AND user_id IS NULL) OR (role_id IS NULL AND user_id IS NOT NULL)),
  CHECK (action IS NOT NULL OR resource IS NOT NULL ),
  CHECK (resource_instance IS NULL OR resource IS NOT NULL), -- Resource should be set if resource instance is provided
  CONSTRAINT pk_permissions PRIMARY KEY (id),
  CONSTRAINT permissions_fk01 FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT permissions_fk02 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;

CREATE UNIQUE INDEX idx_permissions_01 ON permissions (role_id, resource, resource_instance);
CREATE UNIQUE INDEX idx_permissions_02 ON permissions (user_id, resource, resource_instance);


CREATE TABLE ideas (
  id            INT AUTO_INCREMENT,
  organization_id   INT NOT NULL,
  owner_id      INT,
  owner_role_id INT,
  name          VARCHAR(100),
  title         VARCHAR(100),
  CONSTRAINT pk_ideas PRIMARY KEY (id),
  CONSTRAINT ideas_fk01 FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT ideas_fk02 FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT ideas_fk03 FOREIGN KEY (owner_role_id) REFERENCES roles (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;

DELIMITER $$

CREATE PROCEDURE checkConsistencyWithinOrganization(organization_id INT, owner_id INT, owner_role_id INT)
BEGIN
    IF owner_id IS NULL AND owner_role_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot add or update row: owner_id and owner_role_id can not be null in the same time.';
    END IF;

    IF organization_id IS NULL THEN
        IF owner_id IS NULL OR owner_role_id IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Cannot add or update row: owner_id and owner_role_id can not be null.';
        END IF;

        SET organization_id = (SELECT u.organization_id FROM users u where u.id= owner_id);
    END IF;

    IF owner_id IS NOT NULL THEN
        SET @user_org_id  = (SELECT u.organization_id FROM users u where u.id= owner_id);

        IF @user_org_id <> organization_id THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Cannot add or update row: user organization mismatch.';
        END IF;
    END IF;

    IF owner_role_id IS NOT NULL THEN
        SET @role_org_id  = (SELECT r.organization_id FROM roles r where r.id= owner_role_id);

        IF @role_org_id <> organization_id AND @role_org_id <> 1 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Cannot add or update row: role organization mismatch.';
        END IF;
    END IF;
END; $$

CREATE TRIGGER user_roles_insert BEFORE INSERT ON user_roles FOR EACH ROW
BEGIN
    IF @DISABLE_TRIGGERS <> 1 THEN
        call checkConsistencyWithinOrganization(null, New.user_id, NEW.role_id);
    END IF;
END; $$

CREATE TRIGGER user_roles_update BEFORE UPDATE ON user_roles FOR EACH ROW
BEGIN
    IF @DISABLE_TRIGGERS <> 1 THEN
        call checkConsistencyWithinOrganization(null, New.user_id, NEW.role_id);
    END IF;
END; $$

CREATE TRIGGER ideas_insert BEFORE INSERT ON ideas FOR EACH ROW
BEGIN
    IF @DISABLE_TRIGGERS <> 1 THEN
        call checkConsistencyWithinOrganization(NEW.organization_id, NEW.owner_id, NEW.owner_role_id);
    END IF;
END; $$

CREATE TRIGGER ideas_update BEFORE UPDATE ON ideas FOR EACH ROW
BEGIN
    IF @DISABLE_TRIGGERS <> 1 THEN
        call checkConsistencyWithinOrganization(NEW.organization_id, NEW.owner_id, NEW.owner_role_id);
    END IF;
END; $$

DELIMITER ;
