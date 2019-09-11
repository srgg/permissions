INSERT INTO organizations (name,domain) VALUES ('Regression test', 'regression.test');
SET @test = LAST_INSERT_ID();

INSERT INTO groups (organization_id, name, description) VALUES (@test, 'role1', 'Role to test multiple permissions');
SET @gid = LAST_INSERT_ID();

INSERT INTO users (organization_id,name, password,password_salt) VALUES (@test, 'user1@regression.test', 'pw1', 'salt1');
SET @uid = LAST_INSERT_ID();

INSERT INTO user_groups VALUES (@uid,@gid);

INSERT INTO permissions (gid,resource,action) VALUES (@gid, 'Ideas', 'READ');
INSERT INTO permissions (gid,resource,action) VALUES (@gid, 'Ideas', 'CREATE');

INSERT INTO ideas (organization_id, owner_uid, name, title)
    VALUES (@test, @uid, 'idea1@regression.test', 'the 1st idea of idea1@regression.test');
