SET @user_id = 2;
SET @resource = 'IDEA';
SET @action = 'READ';

with ppp AS (
    SELECT * FROM permissions pp
    WHERE
            pp.resource = @resource
      AND   (
                pp.user_id = @user_id
                OR EXISTS (
                    SELECT 1
                        FROM user_roles ur
                        WHERE ur.role_id = pp.role_id AND ur.user_id= @user_id
                )
            )
)
SELECT  i.*,
        (
            SELECT GROUP_CONCAT(DISTINCT REPLACE(p.single_perm, '_OWN', '')) FROM
            (
                SELECT Trim(SUBSTRING_INDEX(SUBSTRING_INDEX(ppp.action, ',', n.digit+1), ',', -1)) single_perm
                FROM ppp
                         INNER JOIN (SELECT 0 digit UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) n
                                    ON LENGTH(REPLACE(ppp.action, ',' , '')) <= LENGTH(ppp.action)-n.digit
            ) p
          WHERE (LOWER(RIGHT(p.single_perm,4)) = '_own' AND i.owner_id = @user_id)
             OR LOWER(RIGHT(p.single_perm,4)) <> '_own'
        ) permissions

FROM ideas i
WHERE
    exists(
            SELECT 1
                FROM ppp
                WHERE
                    -- apply instance filtering if required
                    (
                        ( ppp.resource_instance IS NOT NULL AND ppp.resource_instance = i.id)
                        OR ppp.resource_instance IS NULL
                    ) AND (
                    -- apply action filtering
                        FIND_IN_SET(LCASE(@action), LCASE(ppp.action)) > 0
                        OR (FIND_IN_SET(LCASE(CONCAT(@action,'_OWN')), LCASE(ppp.action)) > 0 AND i.owner_id = @user_id)
                    )
        );
