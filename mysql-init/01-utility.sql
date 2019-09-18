
DELIMITER $$

CREATE PROCEDURE shareResourceToGroup(gid INT, domain VARCHAR(100), instance_id INT, permitted_actions VARCHAR(256))
BEGIN
    INSERT INTO permissions (gid,domain,resource_instance,action) VALUES (gid, domain, instance_id, permitted_actions);
END; $$

CREATE PROCEDURE shareResourceToUser(uid INT, domain VARCHAR(100), instance_id INT, permitted_actions VARCHAR (256))
BEGIN
    INSERT INTO permissions (uid,domain,resource_instance,action) VALUES (uid, domain, instance_id, permitted_actions);
END; $$

DELIMITER ;
