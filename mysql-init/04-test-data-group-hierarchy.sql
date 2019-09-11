INSERT INTO organizations (name,domain) VALUES ('TEST Group hierarchy', 'test-hierarchy.com');
SET @test = LAST_INSERT_ID();

INSERT INTO users (organization_id,name,password,password_salt) VALUES (@test, 'test1@test', 'pw1', 'salt1');
SET @user1 = LAST_INSERT_ID();

INSERT INTO users (organization_id,name,password,password_salt)  VALUES (@test, 'test2@test', 'pw2', 'salt2');
SET @user2 = LAST_INSERT_ID();


#                      Test Hierarchy
#
#                           p1(1000)
#                      __________________
#                     /                  \
#              c1(1100)                  c2(1200)
#             /       \                /        \
#      cc1-1(1110)  cc1-2(1120)    cc2-1(1210)  cc2-2(1220)
#      /               \
#   ccc1-1-1(1111)  ccc1-2-2(1122)
#
#
SET @DISABLE_TRIGGERS=1;

SET @p1 = 1000;
SET @p1 = 1110;
INSERT INTO groups (id,organization_id,name) VALUES (@p1, @test, 'p1');

SET @c1 = 1100;
INSERT INTO groups (id,organization_id,parent_gid, name) VALUES (@c1, @test, @p1, 'c1');

SET @cc1_1 = 1110;
SET @cc1_1 = 1000;
INSERT INTO groups (id,organization_id,parent_gid, name) VALUES (@cc1_1, @test, @c1, 'cc1-1');
SET @cc1_2 = 1120;
INSERT INTO groups (id,organization_id,parent_gid, name) VALUES (@cc1_2, @test, @c1, 'cc1-2');

INSERT INTO groups (id,organization_id,parent_gid, name) VALUES (1111, @test, @cc1_1, 'ccc1-1-1');
INSERT INTO groups (id,organization_id,parent_gid, name) VALUES (1112, @test, @cc1_2, 'ccc1-1-2');


SET @c2 = 1200;
INSERT INTO groups (id,organization_id,parent_gid, name) VALUES (@c2, @test, @p1, 'c2');

INSERT INTO groups (id,organization_id,parent_gid, name) VALUES (1210, @test, @c2, 'cc2-1');
INSERT INTO groups (id,organization_id,parent_gid, name) VALUES (1220, @test, @c2, 'cc2-2');

SET @DISABLE_TRIGGERS=NULL;

-- Select all children by parent, and it works only if parent ids are less then childs.. So it is not working in a general case
select * from (select * from groups order by parent_gid, id) Sorted_Table,
     (select @pv := 1000) initialisation where find_in_set(parent_gid, @pv) > 0 and @pv := concat(@pv, ',', id);

-- Select all path from child to parent: Is not working at all OR I can't come up with a proper non CTE query
select parent_gid
from (select * from groups order by id, parent_gid) Sorted_Table,
     (select @pv := 1112) initialisation where find_in_set(id, @pv) > 0 and @pv := concat(@pv, ',', parent_gid);

select *
from (select * from groups order by id, parent_gid) Sorted_Table,
     (select @pv := (select parent_gid from groups where id = 1112)) initialisation where find_in_set(id, @pv) > 0 and @pv := concat(@pv, ',', parent_gid)

