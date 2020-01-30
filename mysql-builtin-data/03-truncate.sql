USE dbTest;

DROP PROCEDURE IF EXISTS schema_change;

create procedure schema_change()
begin
    if exists(select * from information_schema.TABLES where TABLE_NAME = 'empty_ideas') then
        DROP TABLE IF EXISTS empty_ideas;

        CREATE OR REPLACE VIEW `group` AS
        SELECT * FROM groups;

        ALTER TABLE `users`
            ADD COLUMN email                  VARCHAR(255),
            ADD COLUMN firstName              VARCHAR(255)                DEFAULT '',
            ADD COLUMN lastName               VARCHAR(255)                DEFAULT '',
            CHANGE password_salt secretPhrase varchar(100),
            ADD COLUMN status                 ENUM ('INACTIVE', 'ACTIVE') DEFAULT 'INACTIVE',
            ADD COLUMN activationHash         VARCHAR(255)                DEFAULT '',
            ADD COLUMN expiresAt              TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN refreshToken           VARCHAR(1000)               DEFAULT '';

        CREATE OR REPLACE VIEW `user` AS
        SELECT * FROM users;

        ALTER TABLE ideas
            ADD COLUMN position   INT       DEFAULT 0,
            ADD COLUMN state      ENUM ('COMPLETED', 'DRAFT', 'ACTIVE', 'IMPORTED'),
            ADD COLUMN lockedBy   INT       DEFAULT 0,
            ADD COLUMN lockedAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN isImported TINYINT   DEFAULT 0;

        CREATE OR REPLACE VIEW user_idea AS
        SELECT * FROM ideas;
    end if;
end;

CALL schema_change();
DROP PROCEDURE IF EXISTS schema_change;

TRUNCATE TABLE idea_comments;
DELETE
from ideas;

TRUNCATE TABLE permissions;
TRUNCATE TABLE user_groups;
DELETE
FROM users;

UPDATE `groups`
SET parent_groupid = NULL;
DELETE
FROM groups;

DELETE
FROM organizations;

commit;


