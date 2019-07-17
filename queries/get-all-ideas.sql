SET @user_id = 1;
SET @resource = 'IDEAS';
SET @action = 'READ';

SELECT  i.*
     ,( SELECT GROUP_CONCAT(DISTINCT REPLACE(p.single_perm, '_OWN', '')) FROM
    (
        SELECT Trim(SUBSTRING_INDEX(SUBSTRING_INDEX(ppp.action, ',', n.digit+1), ',', -1)) single_perm
        FROM (
                 SELECT * FROM permissions pp
                 WHERE  pp.resource = @resource
                   AND (
                             pp.user_id = @user_id
                         OR EXISTS (
                                     SELECT 1 FROM user_roles ur
                                     WHERE ur.role_id = pp.role_id AND ur.user_id= @user_id
                                 ))
             ) ppp
                 INNER JOIN (SELECT 0 digit UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) n
                            ON LENGTH(REPLACE(ppp.action, ',' , '')) <= LENGTH(ppp.action)-n.digit
    ) p
        WHERE
            (LOWER(RIGHT(p.single_perm,4)) = '_own' AND i.owner_id = @user_id) OR
                LOWER(RIGHT(p.single_perm,4)) <> '_own' ) permissions
FROM ideas i,
     (
         SELECT * FROM permissions pp
         WHERE  pp.resource = @resource
           AND (
                     pp.user_id = @user_id
                 OR EXISTS (
                             SELECT 1 FROM user_roles ur
                             WHERE ur.role_id = pp.role_id AND ur.user_id= @user_id
                         ))
     ) ppp
WHERE
    exists (
            SELECT 1 FROM DUAL WHERE
                                 -- apply filtering by organization
                EXISTS( SELECT 1 FROM users u WHERE u.id = @user_id AND u.organization_id = i.organization_id)

                                 -- apply instance filtering if required
                                 AND (
                        ( ppp.resource_instance IS NOT NULL AND ppp.resource_instance = i.id)
                        OR ppp.resource_instance IS NULL
                    ) AND (
                    -- apply action filtering
                            FIND_IN_SET(LCASE(@action), REPLACE(LCASE(ppp.action), ' ', '')) > 0

                        -- apply ownership filtering if required
                        OR (FIND_IN_SET(LCASE(CONCAT(@action, '_OWN')), REPLACE(LCASE(ppp.action), ' ', '')) > 0 AND
                            i.owner_id = @user_id)
                    )
        )
