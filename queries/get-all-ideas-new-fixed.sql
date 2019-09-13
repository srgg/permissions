SET @userId = (SELECT id FROM users where name = 'inventor1@emca');
# SET @userId = (SELECT id FROM users where name = 'reviewer1@acme');
# SET @userId = (SELECT id FROM users where name = 'inventor1@acme');
SET @resource = 'IDEAS';
SET @action = 'READ';
SET @orgId = (SELECT  organization_id FROM users where id = @userid);

# select * from permissions pp where pp.id IN (
#     SELECT pp.id
#     FROM permissions pp
#     WHERE pp.resource = @resource
#       AND (
#             pp.uid = @userId
#             OR EXISTS(
#                     SELECT 1
#                     FROM user_groups ug
#                     WHERE ug.gid = pp.gid
#                       AND ug.uid = @userid
#                 )
#         )
# );

-- select calcPermissions('436,438') as permissions


-- do authorization check filtering

SET @userId = (SELECT id FROM users where name = 'inventor1@emca');
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

-- select calcPermissions('436,438') as permissions


-- do authorization check filtering

SELECT ii.*
     , calcPermissions(ii.pids) as permissions
FROM (
         SELECT i.*
              , (
             -- select all applicable permissions for correspondent resource instance
             SELECT GROUP_CONCAT(pp.id) as id
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
               --
               AND (
                      -- apply instance filtering if required
                     (pp.resource_instance IS NOT NULL AND pp.resource_instance = i.id)
                     -- or apply resource ownership filtering, if applicable
                     OR (
                         pp.resource_instance IS NULL
                        AND  (
                        (i.owner_uid IS NOT NULL AND i.owner_uid = @userid)
                                                     OR (i.owner_gid IS NOT NULL AND pp.gid = i.owner_gid)
                   )

                    )
                )

               -- Ensure that exists at least one permission that grants requested permissions
               AND EXISTS (
                     SELECT 1 FROM permissions pp WHERE pp.id IN (
                         select p.id
                         FROM permissions p
                         WHERE p.resource = @resource
                           AND (
                                     p.uid = @userId
                                 OR EXISTS(
                                             SELECT 1
                                             FROM user_groups ug
                                             WHERE ug.gid = p.gid
                                               AND ug.uid = @userid
                                         )
                             )

                     )
                                                    AND (
                             -- apply instance filtering if required
                                 (pp.resource_instance IS NOT NULL AND pp.resource_instance = i.id)
                                 OR pp.resource_instance IS NULL)
                                                    AND ( -- apply action filtering
                                 (FIND_IN_SET(LCASE(@action), REPLACE(LCASE(pp.action), ' ', '')) > 0)

                                 -- apply owner actions, if applicable
                                 OR (
                                     (
                                             (  -- if owner is provided
                                                     (i.owner_uid IS NOT NULL AND i.owner_uid = @userid)
                                                     OR (i.owner_gid IS NOT NULL AND pp.gid = i.owner_gid)

                                                 )
                                             AND -- apply _OWN actions, if any
                                             FIND_IN_SET(LCASE(CONCAT(@action, '_OWN')),
                                                         REPLACE(LCASE(pp.action), ' ', '')) > 0
                                         )
                                     )
                             )
                 )
         ) pids
         FROM ideas i
              -- apply organization filtering
         WHERE i.organization_id = @orgId
     ) ii
WHERE ii.pids IS NOT NULL

