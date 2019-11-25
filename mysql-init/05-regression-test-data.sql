INSERT INTO organizations (name,domain) VALUES ('Regression test', 'regression.test');
SET @test = LAST_INSERT_ID();

INSERT INTO groups (organization_id, name, description) VALUES (@test, 'role1', 'Role to test multiple permissions');
SET @gid = LAST_INSERT_ID();

INSERT INTO permissions (gid,domain,action) VALUES (@gid, 'Ideas', 'READ_OWN');
INSERT INTO permissions (gid,domain,action) VALUES (@gid, 'Ideas', 'CREATE');


INSERT INTO users (organization_id,name, password,password_salt) VALUES (@test, 'user1@regression.test', 'pw1', 'salt1');
SET @uid1 = LAST_INSERT_ID();

INSERT INTO user_groups VALUES (@uid1,@gid);

INSERT INTO ideas (organization_id, owner_uid, name, title)
    VALUES (@test, @uid1, 'idea1@regression.test', 'the 1st idea of idea1@regression.test');


INSERT INTO users (organization_id,name, password,password_salt) VALUES (@test, 'user2@regression.test', 'pw1', 'salt1');
SET @uid2 = LAST_INSERT_ID();

INSERT INTO user_groups VALUES (@uid2,@gid);

INSERT INTO ideas (organization_id, owner_uid, name, title)
    VALUES (@test, @uid2, 'idea1@regression.test', 'the 1st idea of idea2@regression.test');

-- Empty ideas
CREATE TABLE empty_ideas (
  id            INT AUTO_INCREMENT,
  organization_id   INT NOT NULL,
  owner_uid      INT,
  owner_gid INT,
  name          VARCHAR(100),
  title         VARCHAR(100),
  CONSTRAINT pk_eideas PRIMARY KEY (id),
  CONSTRAINT eideas_fk01 FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT eideas_fk02 FOREIGN KEY (owner_uid) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT eideas_fk03 FOREIGN KEY (owner_gid) REFERENCES groups (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 433 CHARACTER SET = utf8 COLLATE = utf8_general_ci;

INSERT INTO permissions (gid, domain, action) VALUES (@gid, 'Empty_IDEAS', 'CREATE, READ, EDIT, DELETE');

