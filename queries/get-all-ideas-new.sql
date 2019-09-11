SET @userId = (SELECT id FROM users where name = 'inventor1@emca');
SET @userId = (SELECT id FROM users where name = 'reviewer1@acme');
SET @userId = (SELECT id FROM users where name = 'inventor1@acme');
SET @resource = 'IDEAS';
SET @action = 'READ';
# SET @action = 'CREATE';
# SET @action = 'EDIT_OWN';
SET @orgId = (SELECT  organization_id FROM users where id = @userid);

SELECT ii.*
        , calcPermissions(ii.pids) as permissions
FROM (
         SELECT i.*
              , (
             SELECT GROUP_CONCAT(pp.id) as id
             FROM permissions pp
             WHERE
                pp.resource = @resource
                AND (
                         pp.uid = @userId
                     OR EXISTS(
                                 SELECT 1
                                 FROM user_groups ug
                                 WHERE ug.gid = pp.gid
                                   AND ug.uid = @userid
                             )
                )

               -- do authorization check filtering

               AND ( -- apply instance filtering if required
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
         ) pids
         FROM ideas i
         -- apply organization filtering
           WHERE i.organization_id = @orgId
     ) ii
WHERE ii.pids IS NOT NULL
