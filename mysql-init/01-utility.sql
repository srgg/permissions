
DELIMITER $$

CREATE PROCEDURE shareResourceToGroup(gid INT, resource VARCHAR(100), instance_id INT, permitted_actions VARCHAR(256))
BEGIN
    INSERT INTO permissions (gid,resource,resource_instance,action) VALUES (gid, resource, instance_id, permitted_actions);
END; $$

CREATE PROCEDURE shareResourceToUser(uid INT, resource VARCHAR(100), instance_id INT, permitted_actions VARCHAR (256))
BEGIN
    INSERT INTO permissions (uid,resource,resource_instance,action) VALUES (uid, resource, instance_id, permitted_actions);
END; $$

DELIMITER ;
