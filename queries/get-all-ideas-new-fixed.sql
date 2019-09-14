SET @userId = (SELECT id FROM users where name = 'inventor1@emca');
#  SET @userId = (SELECT id FROM users where name = 'manager@emca');
# SET @userId = (SELECT id FROM users where name = 'reviewer1@acme');
# SET @userId = (SELECT id FROM users where name = 'inventor2@acme');
SET @resource = 'IDEAS';
SET @action = 'READ';
SET @orgId = (SELECT  organization_id FROM users where id = @userid);

select * from permissions pp where pp.id IN (
    SELECT pp.id
    FROM permissions pp
    WHERE pp.resource = @resource
      AND (
                pp.uid = @userId
            OR EXISTS(
                        SELECT 1
                        FROM user_groups ug
                        WHERE ug.gid = pp.gid
                          AND ug.uid = @userid
                    )
        )
);

SELECT * FROM (
SELECT ii.*, calculatePermittedActionsOrNull(@action, ii.is_owner, ii.pids) permitted FROM (
                                                                         SELECT i.*,
                                                                                (
                                                                                        (i.owner_uid IS NOT NULL AND i.owner_uid = @userId)
                                                                                        OR (i.owner_gid IS NOT NULL AND
                                                                                            EXISTS(
                                                                                                    SELECT 1
                                                                                                    FROM user_groups ur
                                                                                                    WHERE ur.gid = i.owner_gid
                                                                                                      AND ur.uid = @userId
                                                                                                )
                                                                                            )
                                                                                    ) is_owner,
                                                                                (
                                                                                    SELECT GROUP_CONCAT(pp.id) as id
                                                                                    FROM permissions pp
                                                                                    WHERE pp.resource = @resource
                                                                                      AND ( -- include only permissions granted to user either directly or by group membership
                                                                                                pp.uid = @userId
                                                                                            OR EXISTS(
                                                                                                        SELECT 1
                                                                                                        FROM user_groups ur
                                                                                                        WHERE ur.gid = pp.gid
                                                                                                          AND ur.uid = @userId
                                                                                                    )
                                                                                        )
                                                                                      AND (
                                                                                        -- apply instance filtering, if required
                                                                                            (pp.resource_instance IS NOT NULL AND pp.resource_instance = i.id)
                                                                                            OR pp.resource_instance IS NULL
                                                                                        )
                                                                                ) pids
                                                                         FROM ideas i
                                                                         WHERE
                                                                           -- apply organization filtering
                                                                           i.organization_id = @orgId
                                                                     ) ii ) iii WHERE iii.permitted IS NOT NULL;
;




# SELECT ii.id, ii.name, ii.organization_id, ii.owner_uid, ii.owner_gid, ii.title
#      , calcPermissions(ii.pids) as permissions
# FROM (
#          SELECT i.*
#               , (
#              SELECT GROUP_CONCAT(pp.id) as id
#              FROM permissions pp
#              WHERE
#                      pp.resource = @resource
#                AND (
#                          pp.uid = @userId
#                      OR EXISTS(
#                                  SELECT 1
#                                  FROM user_groups ur
#                                  WHERE ur.gid = pp.gid
#                                    AND ur.uid = @userId
#                              )
#                  )
#                --
#                AND (
#                  -- apply instance filtering if required
#                      (pp.resource_instance IS NOT NULL AND pp.resource_instance = i.id)
#
#                      -- or apply resource ownership filtering, if applicable
#                      OR (
#                              pp.resource_instance IS NULL
#
#                              AND (  -- if owner is provided
#                                      (i.owner_uid IS NOT NULL AND i.owner_uid = @userId)
#                                      OR (i.owner_gid IS NOT NULL AND pp.gid = i.owner_gid)
#                                  )
#                          )
#                  )
#
#                AND EXISTS (
#                      SELECT 1 FROM permissions pp WHERE pp.id IN (
#                          select p.id
#                          FROM permissions p
#                          WHERE p.resource = @resource
#                            AND (
#                                      p.uid = @userId
#                                  OR EXISTS(
#                                              SELECT 1
#                                              FROM user_groups ug
#                                              WHERE ug.gid = p.gid
#                                                AND ug.uid = @userId
#                                          )
#                              )
#
#                      )
#
#                                                     -- do authorization check filtering
#
#                                                     AND ( -- apply instance filtering if required
#                                  (pp.resource_instance IS NOT NULL AND pp.resource_instance = i.id)
#                                  OR pp.resource_instance IS NULL)
#
#
#                                                     AND ( -- apply action filtering
#                                  (FIND_IN_SET(LCASE(@action), REPLACE(LCASE(pp.action), ' ', '')) > 0)
#
#                                  -- apply owner actions, if applicable
#                                  OR (
#                                      -- apply _OWN actions, if any
#                                              FIND_IN_SET(LCASE(CONCAT(@action, '_OWN')),
#                                                          REPLACE(LCASE(pp.action), ' ', '')) > 0
#
#                                          AND (  -- if owner is provided
#                                                      (i.owner_uid IS NOT NULL AND i.owner_uid = @userId)
#                                                      OR (i.owner_gid IS NOT NULL AND pp.gid = i.owner_gid)
#                                                  )
#                                      )
#                              )
#                  )
#          ) pids
#          FROM ideas i
#               -- apply organization filtering
#          WHERE i.organization_id = @orgId
#
#      ) ii
# WHERE ii.pids IS NOT NULL
#
