
DELIMITER $$

CREATE PROCEDURE shareResourceToGroup(oid INT, gid INT, res VARCHAR(100), res_id INT, permitted_actions VARCHAR(256))
BEGIN
    /*
        oid is required to handle situations when gid is a builtin group and effective oid can not be properly calculated as a result.
        Hypothetically it is  possible to dance around this get oid from a particular resource if it is provided, but it will
        require to use dynamic SQL and doesn't work  for a entire domain permissions. Therefore sucj improvement makes no sense
     */
    INSERT INTO permissions (organizationId, groupId,resource,resourceId,actions) VALUES (oid, gid, res, res_id, permitted_actions);
END; $$

CREATE PROCEDURE shareResourceToUser(uid INT, res VARCHAR(100), res_id INT, permitted_actions VARCHAR (256))
BEGIN
    INSERT INTO permissions (userId,resource,resourceId,actions) VALUES (uid, res, res_id, permitted_actions);
END; $$

DELIMITER ;
