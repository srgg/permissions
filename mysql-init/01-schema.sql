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
CREATE UNIQUE INDEX idx_users_username ON users (name);


CREATE TABLE roles (
  id                INT AUTO_INCREMENT,
  organization_id   INT,
  name              VARCHAR(100) NOT NULL,
  description       VARCHAR(512),
  CONSTRAINT pk_roles_permissions PRIMARY KEY (id),
  CONSTRAINT roless_fk01 FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
CREATE UNIQUE INDEX idx_roles_name ON roles (name);


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
  CONSTRAINT pk_permissions PRIMARY KEY (id),
  CONSTRAINT permissions_fk01 FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT permissions_fk02 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;

CREATE UNIQUE INDEX idx_permissions_01 ON permissions (role_id, resource, resource_instance);
CREATE UNIQUE INDEX idx_permissions_02 ON permissions (user_id, resource, resource_instance);


CREATE TABLE ideas (
  id            INT AUTO_INCREMENT,
  organization_id   INT,
  owner_id      INT,
  name          VARCHAR(100),
  title         VARCHAR(100),
  CONSTRAINT pk_ideas PRIMARY KEY (id),
  CONSTRAINT ideas_fk01 FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT ideas_fk02 FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;
