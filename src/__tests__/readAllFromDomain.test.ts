'use strict';

// https://houbb.github.io/2016/08/11/shiro
// https://stackoverflow.com/questions/20215744/how-to-create-a-mysql-hierarchical-recursive-query
// https://blog.morizyun.com/javascript/library-typescript-jest-unit-test.html

import { checkReadAllQuery} from "./common";
import { checkReadAllSubQuery} from "./common";

describe('Read all from a particular Domain', () => {

    describe('Read all from IDEAS', () => {
        test('1st inventor should be able to read own ideas as well as all ideas shared to group', async () => {
            await checkReadAllQuery({
                    user: 'inventor1@acme', domain: 'USER_IDEA', action: 'READ',
                    checkOwnership: true
                },
                `
            [
                {
                  id: 1,
                  organizationId:2,
                  ownerUserId:1,
                  ownerGroupId: null,
                  name:'idea1@acme',
                  title:'the 1st idea of inventor1@acme',
                  permitted:'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
                },
                {
                  id:2,
                  organizationId:2,
                  ownerUserId:1,
                  ownerGroupId: null,
                  name:'idea2@acme',
                  title:'the 2nd idea of inventor1@acme',
                  permitted:'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
                },
               {   id: 9,
                   name: 'shared-idea1@acme',
                   organizationId: 2,
                   ownerUserId: null,
                   ownerGroupId: 1,
                   title: 'the 1st shared idea at acme',               
                   permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               },
               {
                    id: 10,
                    name: 'shared-idea2@acme',
                    organizationId: 2,
                    ownerUserId: null,
                    ownerGroupId: 1,
                    title: 'the 2nd shared idea at acme',               
                    permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               }                
            ]`);
        });

        test('2nd inventor should be able to read his own ideas as well as an idea shared by the first inventor and all ideas shared to group', async () => {
            await checkReadAllQuery({
                    user: 'inventor2@acme', domain: 'USER_IDEA', action: 'READ',
                    checkOwnership: true
                },
                `[
               {
                  id:1,
                  organizationId:2,
                  ownerUserId:1,
                  ownerGroupId: null,
                  name:'idea1@acme',
                  title:'the 1st idea of inventor1@acme',
                  permitted:'CREATE,READ'
               },
               {
                  id:3,
                  organizationId:2,
                  ownerUserId:2,
                  ownerGroupId: null,
                  name:'idea1@acme',
                  title:'the 1st idea of inventor2@acme',
                  permitted:'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               },
               {
                  id:4,
                  organizationId:2,
                  ownerUserId:2,
                  ownerGroupId: null,
                  name:'idea2@acme',
                  title:'the 2nd idea of inventor2@acme',
                  permitted:'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               },
               {   id: 9,
                    name: 'shared-idea1@acme',
                    organizationId: 2,
                    ownerUserId: null,
                    ownerGroupId: 1,
                    title: 'the 1st shared idea at acme',               
                    permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               },
               {
                    id: 10,
                    name: 'shared-idea2@acme',
                    organizationId: 2,
                    ownerUserId: null,
                    ownerGroupId: 1,
                    title: 'the 2nd shared idea at acme',               
                    permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               }               
            ]`);
        });

        test('3rd inventor should be able to read the only ideas shared to role/group, as he has none of own ideas', async () => {
            await checkReadAllQuery({
                    user: 'inventor3@acme', domain: 'USER_IDEA', action: 'READ',
                    checkOwnership: true
                },
                `[
               {   id: 9,
                   name: 'shared-idea1@acme',
                   organizationId: 2,
                   ownerUserId: null,
                   ownerGroupId: 1,
                   title: 'the 1st shared idea at acme',               
                   permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               },
               {
                   id: 10,
                   name: 'shared-idea2@acme',
                   organizationId: 2,
                   ownerUserId: null,
                   ownerGroupId: 1,
                   title: 'the 2nd shared idea at acme',               
                   permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               }
            ]`);
        });

        test('Inventors at emca should not be able to Delete ideas shared to role/group', async () => {
            await checkReadAllQuery({
                    user: 'inventor1@emca', domain: 'USER_IDEA', action: 'READ',
                    checkOwnership: true
                },
                `[
                  {
                    id: 5,
                    name: 'idea1@emca',
                    organizationId: 3,
                    ownerUserId: 5,
                    ownerGroupId: null,
                    title: 'the 1st idea of inventor1@emca',
                    permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
                  },
                  {
                    id: 6,
                    name: 'idea2@emca',
                    organizationId: 3,
                    ownerUserId: 5,
                    ownerGroupId: null,
                    title: 'the 2nd idea of inventor1@emca',
                    permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
                  },
                  {
                    id: 7,
                    name: 'idea1@emca',
                    organizationId: 3,
                    ownerUserId: 6,
                    ownerGroupId: null,
                    title: 'the 1st idea of inventor2@emca',
                    permitted: 'CREATE,EDIT,READ,READ-COMMENT_SHARED'
                  },
                  {
                    id: 13,
                    name: 'shared-idea1@emca',
                    organizationId: 3,
                    ownerUserId: null,
                    ownerGroupId: 2,
                    title: 'the 1st shared idea at emca',
                    permitted: 'CREATE,EDIT_SHARED,READ,READ-COMMENT_SHARED,READ_SHARED'
                  },
                  {
                    id: 14,
                    name: 'shared-idea2@emca',
                    organizationId: 3,
                    ownerUserId: null,
                    ownerGroupId: 2,
                    title: 'the 2nd shared idea at emca',
                    permitted: 'CREATE,EDIT_SHARED,READ,READ-COMMENT_SHARED,READ_SHARED'
                  }
            ]`);
        });

        test('Manger should be able to read all the ideas of the entire organization, even orphans', async () => {
            await checkReadAllQuery({
                    user: 'manager@acme', domain: 'USER_IDEA', action: 'READ',
                    checkOwnership: true
                },
                `[
               {
                  id:1,
                  organizationId:2,
                  ownerUserId:1,
                  ownerGroupId: null,
                  name:'idea1@acme',
                  title:'the 1st idea of inventor1@acme',
                  permitted:'DELETE,EDIT,READ'
               },
               {
                  id:2,
                  organizationId:2,
                  ownerUserId:1,
                  ownerGroupId: null,
                  name:'idea2@acme',
                  title:'the 2nd idea of inventor1@acme',
                  permitted:'DELETE,EDIT,READ'
               },
               {
                  id:3,
                  organizationId:2,
                  ownerUserId:2,
                  ownerGroupId: null,
                  name:'idea1@acme',
                  title:'the 1st idea of inventor2@acme',
                  permitted:'DELETE,EDIT,READ'
               },
               {
                  id:4,
                  organizationId:2,
                  ownerUserId:2,
                  ownerGroupId: null,
                  name:'idea2@acme',
                  title:'the 2nd idea of inventor2@acme',
                  permitted:'DELETE,EDIT,READ'
               },
               {  id: 9,
                  name: 'shared-idea1@acme',
                  organizationId: 2,
                  ownerUserId: null,
                  ownerGroupId: 1,
                  title: 'the 1st shared idea at acme',               
                  permitted: 'DELETE,EDIT,READ'
               },
               {
                  id: 10,
                  name: 'shared-idea2@acme',
                  organizationId: 2,
                  ownerUserId: null,
                  ownerGroupId: 1,
                  title: 'the 2nd shared idea at acme',               
                  permitted: 'DELETE,EDIT,READ'
               },
               {
                  id: 11,
                  name: 'orphan-idea1@acme',
                  organizationId: 2,
                  ownerUserId: null,
                  ownerGroupId: null,
                  permitted: 'DELETE,EDIT,READ',
                  title: 'the 1st orphan idea at acme'
               },
               {
                  id: 12,
                  name: 'orphan-idea2@acme',
                  organizationId: 2,
                  ownerUserId: null,
                  ownerGroupId: null,
                  permitted: 'DELETE,EDIT,READ',
                  title: 'the 2nd orphan idea at acme'
               }
            ]`);
        });

        test('Manger at emca should be able to read all the ideas of the entire organization, even orphans', async () => {
            await checkReadAllQuery({
                    user: 'manager@emca', domain: 'USER_IDEA', action: 'READ',
                    checkOwnership: true
                },
                `[
               {  
                    id:5,
                    name:'idea1@emca',
                    organizationId:3,
                    ownerUserId:5,
                    ownerGroupId:null,
                    title:'the 1st idea of inventor1@emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:6,
                    name:'idea2@emca',
                    organizationId:3,
                    ownerUserId:5,
                    ownerGroupId:null,
                    title:'the 2nd idea of inventor1@emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:7,
                    name:'idea1@emca',
                    organizationId:3,
                    ownerUserId:6,
                    ownerGroupId:null,
                    title:'the 1st idea of inventor2@emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:8,
                    name:'idea2@emca',
                    organizationId:3,
                    ownerUserId:6,
                    ownerGroupId:null,
                    title:'the 2nd idea of inventor2@emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:13,
                    name:'shared-idea1@emca',
                    organizationId:3,
                    ownerUserId:null,
                    ownerGroupId:2,
                    title:'the 1st shared idea at emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:14,
                    name:'shared-idea2@emca',
                    organizationId:3,
                    ownerUserId:null,
                    ownerGroupId:2,
                    title:'the 2nd shared idea at emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:15,
                    name:'orphan-idea1@emca',
                    organizationId:3,
                    ownerUserId:null,
                    ownerGroupId:null,
                    title:'the 1st orphan idea at emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:16,
                    name:'orphan-idea2@emca',
                    organizationId:3,
                    ownerUserId:null,
                    ownerGroupId:null,
                    title:'the 2nd orphan idea at emca',
                    permitted:'DELETE,EDIT,READ'
               }
            ]`);
        });

        test('Organization admin  should not be able to read ideas', async () => {
            await checkReadAllQuery({
                    user: 'admin@emca', domain: 'user_idea', action: 'READ',
                    checkOwnership: true
                },
                `[]`
            );
        });

        test('1st reviewer at emca should be able to read shared ideas of the entire organization', async () => {
            await checkReadAllQuery({
                    user: 'reviewer1@emca', domain: 'user_idea', action: 'ReAd',
                    columns: ['id', 'name', 'permitted'],
                    checkOwnership: true
                },
                `[
               {  
                    id:13,
                    name:'shared-idea1@emca',
                    permitted:'CREATE-COMMENT_SHARED,READ,READ-COMMENT_SHARED,READ_SHARED'
               },
               {  
                    id:14,
                    name:'shared-idea2@emca',
                    permitted:'CREATE-COMMENT_SHARED,READ,READ-COMMENT_SHARED,READ_SHARED'
               }
            ]`);
        });

        test('1st reviewer at emca should be able to read a particular shared idea using query extension mechanism', async () => {
            await checkReadAllQuery({
                    user: 'reviewer1@emca', domain: 'user_idea', action: 'ReAd',
                    columns: ['id', 'name', 'permitted'],
                    checkOwnership: true,
                    query_extension: 'AND prime.id = :idea_id',
                    extended_params: {idea_id: 13}
                },
                `[
               {  
                    id:13,
                    name:'shared-idea1@emca',
                    permitted:'CREATE-COMMENT_SHARED,READ,READ-COMMENT_SHARED,READ_SHARED'
               }
            ]`);
        });
    });

    describe('Read all from USERS', () => {
        test('Inventor should not be able to read users', async () => {
            await checkReadAllQuery({
                    user: 'inventor1@acme', domain: 'users', action: 'READ',
                    checkOwnership: false
                },
                `[]`
            );
        });

        test('Manager should not be able to read users', async () => {
            await checkReadAllQuery({
                    user: 4, domain: 'users', action: 'READ',
                    checkOwnership: false
                },
                `[]`
            );
        });

        test('Organization admin should be able to read all users of the entire organization, result should contains user groups', async () => {
            await checkReadAllQuery({
                    user: 'admin@emca', domain: 'users', action: 'ReAd',
                    columns: ['id', 'organizationId', 'name', 'permitted',
                        '(SELECT GROUP_CONCAT( g.name)  FROM groups g, user_groups ug WHERE g.id = ug.gid AND ug.uid = prime.id) as groups'],
                    checkOwnership: false
                },
                `[
               {
                  id:5,
                  organizationId:3,
                  groups: 'inventor,shared-idea-inventors',
                  name:'inventor1@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:6,
                  organizationId:3,
                  groups: 'inventor,shared-idea-inventors',
                  name:'inventor2@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:7,
                  organizationId:3,
                  groups: 'inventor,shared-idea-inventors',
                  name:'inventor3@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:8,
                  organizationId:3,
                  groups: 'idea-manager',
                  name:'manager@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:9,
                  organizationId:3,
                  groups: 'admin',
                  name:'admin@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:435,
                  organizationId:3,
                  groups: 'idea-reviewer',
                  name:'reviewer1@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:436,
                  organizationId:3,
                  groups: 'idea-reviewer',
                  name:'reviewer2@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               }
            ]`);
        });
    });

    test('Organization admin should not be able to read organizations', async () => {
        await checkReadAllQuery({
                user: 'admin@emca', domain: 'organizations', action: 'ReAd',
                checkOwnership: false,
                organizationId: null
            },
            `[]`
        );
    });

    test('Platform admin should be able to read all organizations', async () => {
        await checkReadAllQuery({
                user: 'platform-admin@platform', domain: 'organizations', action: 'ReAd',
                checkOwnership: false,
                organizationId: null
            },
            `[
            {
                domain: 'common.dot',
                id: 1,
                is_owner: 1,
                name: 'common organization',
                permitted: 'CREATE,DELETE,EDIT,READ',
                pids: '1',
                text: null
            },
            {
                domain: 'paltform.com',
                id: 4,
                is_owner: 1,
                name: 'PLATFORM',
                permitted: 'CREATE,DELETE,EDIT,READ',
                pids: '1',
                text: null
            },
            {
                domain: 'acme.com',
                id: 2,
                is_owner: 1,
                name: 'ACME',
                permitted: 'CREATE,DELETE,EDIT,READ',
                pids: '1',
                text: null
            },
            {
                domain: 'emca.com',
                id: 3,
                is_owner: 1,
                name: 'EMCA',
                permitted: 'CREATE,DELETE,EDIT,READ',
                pids: '1',
                text: null
            },
            {
                domain: 'test-hierarchy.com',
                id: 433,
                is_owner: 1,
                name: 'TEST Group hierarchy',
                permitted: 'CREATE,DELETE,EDIT,READ',
                pids: '1',
                text: null
            },
            {
                domain: 'regression.test',
                id: 434,
                is_owner: 1,
                name: 'Regression test',
                permitted: 'CREATE,DELETE,EDIT,READ',
                pids: '1',
                text: null
            }]`
        );
    });


    describe('Read all from IDEAS.COMMENTS', () => {
        test('1st reviewer at emca should be able to read comments on shared ideas the only (of the entire organization)', async () => {
            await checkReadAllSubQuery({
                    user: 'reviewer1@emca', domain: 'user_idea.comment', action: 'READ-COMMENT_SHARED',
                    columns: ['id', 'ownerUserId', 'userIdeaId', 'text', 'permitted'],
                    checkOwnership: true
                    // ,organizationId: null
                },
                `[
                {
                    id: 439,
                    userIdeaId: 13,
                    ownerUserId: 435,
                    permitted: 'READ-COMMENT_SHARED,DELETE_OWN,EDIT_OWN,READ_OWN',
                    text: '1st comment by rewiewer1@emca on the 1st shared idea at emca'
                },
                {
                    id: 440,
                    userIdeaId: 14,
                    ownerUserId: 435,
                    permitted: 'READ-COMMENT_SHARED,DELETE_OWN,EDIT_OWN,READ_OWN',
                    text: '1st comment by rewiewer1@emca on the 2nd shared idea at emca'
                },
                {
                    id: 441,
                    userIdeaId: 13,
                    ownerUserId: 436,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer2@emca on the 1st shared idea at emca'
                },
                {
                    id: 442,
                    userIdeaId: 14,
                    ownerUserId: 436,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer2@emca on the 2nd shared idea at emca'
                },
                {
                    id: 443,
                    userIdeaId: 13,
                    ownerUserId: 5,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by inventor1@emca on the 1st shared idea at emca'
                },
                {
                    id: 444,
                    userIdeaId: 14,
                    ownerUserId: 5,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by inventor1@emca on the 2nd shared idea at emca'
                }
            ]`);
        });

        test('1st inventor at emca should be able to read comments on shared ideas including p2p sharing.', async () => {
            await checkReadAllSubQuery({
                    user: 'inventor1@emca', domain: 'user_idea.comment', action: 'READ-COMMENT_SHARED',
                    columns: ['id', 'ownerUserId', 'userIdeaId', 'text', 'permitted'],
                    checkOwnership: true
                },
                `[
                {
                    id: 439,
                    userIdeaId: 13,
                    ownerUserId: 435,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer1@emca on the 1st shared idea at emca'
                },
                {
                    id: 440,
                    userIdeaId: 14,
                    ownerUserId: 435,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer1@emca on the 2nd shared idea at emca'
                },
                {
                    id: 441,
                    userIdeaId: 13,
                    ownerUserId: 436,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer2@emca on the 1st shared idea at emca'
                },
                {
                    id: 442,
                    userIdeaId: 14,
                    ownerUserId: 436,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer2@emca on the 2nd shared idea at emca'
                },
                {
                    id: 443,
                    userIdeaId: 13,
                    ownerUserId: 5,
                    permitted: 'READ-COMMENT_SHARED,DELETE_OWN,EDIT_OWN',
                    text: '1st comment by inventor1@emca on the 1st shared idea at emca'
                },
                {
                    id: 444,
                    userIdeaId: 14,
                    ownerUserId: 5,
                    permitted: 'READ-COMMENT_SHARED,DELETE_OWN,EDIT_OWN',
                    text: '1st comment by inventor1@emca on the 2nd shared idea at emca'
                },
                {
                    id: 445,
                    userIdeaId: 7,
                    ownerUserId: 5,
                    permitted: 'READ-COMMENT_SHARED,DELETE_OWN,EDIT_OWN',
                    text: '1st comment by inventor1@emca on the 1st idea of inventor2@emca'
                },
                {
                    id: 447,
                    userIdeaId: 7,
                    ownerUserId: 6,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by inventor2@emca on the 1st idea of inventor2@emca'
                }
            ]`);
        });

    });

    test('1st inventor at emca should be able to read all comments for a particular idea  using query extension mechanism', async () => {
        await checkReadAllSubQuery({
                user: 'inventor1@emca', domain: 'user_idea.comment', action: 'READ-COMMENT_SHARED',
                columns: ['id', '(SELECT name FROM users WHERE id = sub.ownerUserId) as commentedBy', 'userIdeaId', 'text', 'permitted'],
                checkOwnership: true,
                query_extension: 'AND sub.userIdeaId = :idea_id',
                extended_params: {idea_id: 13}
            },
            `[
                {
                    id: 439,
                    userIdeaId: 13,
                    commentedBy: 'reviewer1@emca',
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer1@emca on the 1st shared idea at emca'
                },
                {
                    id: 441,
                    userIdeaId: 13,
                    commentedBy: 'reviewer2@emca',
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer2@emca on the 1st shared idea at emca'
                },
                {
                    id: 443,
                    userIdeaId: 13,
                    commentedBy: 'inventor1@emca',
                    permitted: 'READ-COMMENT_SHARED,DELETE_OWN,EDIT_OWN',
                    text: '1st comment by inventor1@emca on the 1st shared idea at emca'
                }            
            ]`);
    });

    test('1st inventor at emca should be able to read particular comment on shared idea using query extension mechanism', async () => {
        await checkReadAllSubQuery({
                user: 'inventor1@emca', domain: 'user_idea.comment', action: 'READ-COMMENT_SHARED',
                columns: ['id', 'ownerUserId', 'userIdeaId', 'text', 'permitted'],
                checkOwnership: true,
                query_extension: 'AND sub.id = :id',
                extended_params: {id: 439}

            },
            `[
                {
                    id: 439,
                    userIdeaId: 13,
                    ownerUserId: 435,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer1@emca on the 1st shared idea at emca'
                }
            ]`);
        });


    describe('Read all from Permissions', () => {
        test('Organization admin should be able to read all permissions of the entire organization and builtin ones', async () => {
            await checkReadAllQuery({
                    user: 'admin@emca', domain: 'permission', action: 'ReAd',
                    columns: ['id', 'organizationId', 'resource', '(SELECT name FROM groups where id = prime.groupId) as "group"', 'userId', 'resourceId', 'actions', 'permitted'],
                    checkOwnership: false
                },
                `[
                {
                    id: 1,
                    organizationId: 1,
                    resource: 'organizations',
                    group: 'platform admin',
                    userId: null,
                    actions: 'READ, CREATE, EDIT, DELETE',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: null
                },
                {
                    id: 433,
                    organizationId: 1,
                    resource: 'users',
                    group: 'admin',
                    userId: null,
                    actions: 'READ, CREATE, EDIT, DELETE',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: null
                },
                {
                    id: 434,
                    organizationId: 1,
                    resource: 'permission',
                    group: 'admin',
                    userId: null,
                    actions: 'READ, CREATE, EDIT, DELETE',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: null
                },
                {
                    id: 435,
                    organizationId: 1,
                    resource: 'Comment',
                    group: 'idea-reviewer',
                    userId: null,
                    actions: 'READ_OWN, DELETE_OWN, EDIT_OWN',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: null
                },
                {
                    id: 436,
                    organizationId: 1,
                    resource: 'User_Idea',
                    userId: null,
                    group: 'inventor',
                    actions: 'READ_OWN, CREATE, EDIT_OWN, DELETE_OWN',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: null
                },
                {
                    id: 437,
                    organizationId: 1,
                    resource: 'USEr_IDEA',
                    group: 'idea-manager',
                    userId: null,
                    actions: 'READ, EDIT, DELETE',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: null
                },
                {
                    id: 438,
                    organizationId: 1,
                    resource: 'User_Idea',
                    group: 'idea-reviewer',
                    userId: null,
                    actions: 'READ_SHARED, CREATE-COMMENT_SHARED',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: null
                },
                {
                    id: 439,
                    organizationId: 1,
                    resource: 'User_Idea',
                    group: 'inventor',
                    userId: null,
                    actions: 'CREATE-COMMENT_OWN, READ-COMMENT_OWN',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: null
                },
                {
                    id: 440,
                    organizationId: 1,
                    resource: 'Comment',
                    group: 'inventor',
                    userId: null,
                    actions: 'DELETE_OWN, EDIT_OWN',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: null
                },
                {
                    id: 443,
                    organizationId: 3,
                    resource: 'user_idea',
                    actions: 'READ,READ_SHARED, EDIT_SHARED, READ-COMMENT_SHARED',                                        
                    group: 'shared-idea-inventors',
                    userId: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: 13
                },
                {
                    id: 444,
                    organizationId: 3,
                    resource: 'user_idea',
                    group: 'shared-idea-inventors',
                    userId: null,
                    actions: 'READ,READ_SHARED, EDIT_SHARED, READ-COMMENT_SHARED',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: 14
                },
                {
                    id: 445,
                    organizationId: 3,
                    resource: 'user_idea',
                    group: null,
                    userId: 5,
                    actions: 'READ,READ-COMMENT_SHARED,EDIT',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: 7
                },
                {
                    id: 446,
                    organizationId: 3,
                    resource: 'user_IdEa',
                    group: null,
                    userId: 5,
                    actions: 'READ_OWN, READ-COMMENT_SHARED_OWN,EDIT_OWN',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: 8
                },
                {
                    id: 449,
                    organizationId: 3,
                    resource: 'user_idea',
                    group: 'idea-reviewer',
                    userId: null,
                    actions: 'READ,READ_SHARED,READ-COMMENT_SHARED',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: 13
                },
                {
                    id: 450,
                    organizationId: 3,
                    resource: 'user_idea',
                    group: 'idea-reviewer',
                    userId: null,
                    actions: 'READ,READ_SHARED, READ-COMMENT_SHARED',
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resourceId: 14
                }
            ]`);
        })
    })
});
