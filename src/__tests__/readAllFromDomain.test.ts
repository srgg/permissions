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
                    user: 'inventor1@acme', domain: 'IDEAS', action: 'READ',
                    checkOwnership: true
                },
                `
            [
                {
                  id: 1,
                  organization_id:2,
                  owner_uid:1,
                  owner_gid: null,
                  name:'idea1@acme',
                  title:'the 1st idea of inventor1@acme',
                  permitted:'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
                },
                {
                  id:2,
                  organization_id:2,
                  owner_uid:1,
                  owner_gid: null,
                  name:'idea2@acme',
                  title:'the 2nd idea of inventor1@acme',
                  permitted:'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
                },
               {   id: 9,
                   name: 'shared-idea1@acme',
                   organization_id: 2,
                   owner_uid: null,
                   owner_gid: 1,
                   title: 'the 1st shared idea at acme',               
                   permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               },
               {
                    id: 10,
                    name: 'shared-idea2@acme',
                    organization_id: 2,
                    owner_uid: null,
                    owner_gid: 1,
                    title: 'the 2nd shared idea at acme',               
                    permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               }                
            ]`);
        });

        test('2nd inventor should be able to read his own ideas as well as an idea shared by the first inventor and all ideas shared to group', async () => {
            await checkReadAllQuery({
                    user: 'inventor2@acme', domain: 'IDEAS', action: 'READ',
                    checkOwnership: true
                },
                `[
               {
                  id:1,
                  organization_id:2,
                  owner_uid:1,
                  owner_gid: null,
                  name:'idea1@acme',
                  title:'the 1st idea of inventor1@acme',
                  permitted:'CREATE,READ'
               },
               {
                  id:3,
                  organization_id:2,
                  owner_uid:2,
                  owner_gid: null,
                  name:'idea1@acme',
                  title:'the 1st idea of inventor2@acme',
                  permitted:'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               },
               {
                  id:4,
                  organization_id:2,
                  owner_uid:2,
                  owner_gid: null,
                  name:'idea2@acme',
                  title:'the 2nd idea of inventor2@acme',
                  permitted:'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               },
               {   id: 9,
                    name: 'shared-idea1@acme',
                    organization_id: 2,
                    owner_uid: null,
                    owner_gid: 1,
                    title: 'the 1st shared idea at acme',               
                    permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               },
               {
                    id: 10,
                    name: 'shared-idea2@acme',
                    organization_id: 2,
                    owner_uid: null,
                    owner_gid: 1,
                    title: 'the 2nd shared idea at acme',               
                    permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               }               
            ]`);
        });

        test('3rd inventor should be able to read the only ideas shared to role/group, as he has none of own ideas', async () => {
            await checkReadAllQuery({
                    user: 'inventor3@acme', domain: 'IDEAS', action: 'READ',
                    checkOwnership: true
                },
                `[
               {   id: 9,
                   name: 'shared-idea1@acme',
                   organization_id: 2,
                   owner_uid: null,
                   owner_gid: 1,
                   title: 'the 1st shared idea at acme',               
                   permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               },
               {
                   id: 10,
                   name: 'shared-idea2@acme',
                   organization_id: 2,
                   owner_uid: null,
                   owner_gid: 1,
                   title: 'the 2nd shared idea at acme',               
                   permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
               }
            ]`);
        });

        test('Inventors at emca should not be able to Delete ideas shared to role/group', async () => {
            await checkReadAllQuery({
                    user: 'inventor1@emca', domain: 'IDEAS', action: 'READ',
                    checkOwnership: true
                },
                `[
                  {
                    id: 5,
                    name: 'idea1@emca',
                    organization_id: 3,
                    owner_uid: 5,
                    owner_gid: null,
                    title: 'the 1st idea of inventor1@emca',
                    permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
                  },
                  {
                    id: 6,
                    name: 'idea2@emca',
                    organization_id: 3,
                    owner_uid: 5,
                    owner_gid: null,
                    title: 'the 2nd idea of inventor1@emca',
                    permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
                  },
                  {
                    id: 7,
                    name: 'idea1@emca',
                    organization_id: 3,
                    owner_uid: 6,
                    owner_gid: null,
                    title: 'the 1st idea of inventor2@emca',
                    permitted: 'CREATE,EDIT,READ,READ-COMMENT_SHARED'
                  },
                  {
                    id: 13,
                    name: 'shared-idea1@emca',
                    organization_id: 3,
                    owner_uid: null,
                    owner_gid: 2,
                    title: 'the 1st shared idea at emca',
                    permitted: 'CREATE,EDIT_SHARED,READ,READ-COMMENT_SHARED,READ_SHARED'
                  },
                  {
                    id: 14,
                    name: 'shared-idea2@emca',
                    organization_id: 3,
                    owner_uid: null,
                    owner_gid: 2,
                    title: 'the 2nd shared idea at emca',
                    permitted: 'CREATE,EDIT_SHARED,READ,READ-COMMENT_SHARED,READ_SHARED'
                  }
            ]`);
        });

        test('Manger should be able to read all the ideas of the entire organization, even orphans', async () => {
            await checkReadAllQuery({
                    user: 'manager@acme', domain: 'IDEAS', action: 'READ',
                    checkOwnership: true
                },
                `[
               {
                  id:1,
                  organization_id:2,
                  owner_uid:1,
                  owner_gid: null,
                  name:'idea1@acme',
                  title:'the 1st idea of inventor1@acme',
                  permitted:'DELETE,EDIT,READ'
               },
               {
                  id:2,
                  organization_id:2,
                  owner_uid:1,
                  owner_gid: null,
                  name:'idea2@acme',
                  title:'the 2nd idea of inventor1@acme',
                  permitted:'DELETE,EDIT,READ'
               },
               {
                  id:3,
                  organization_id:2,
                  owner_uid:2,
                  owner_gid: null,
                  name:'idea1@acme',
                  title:'the 1st idea of inventor2@acme',
                  permitted:'DELETE,EDIT,READ'
               },
               {
                  id:4,
                  organization_id:2,
                  owner_uid:2,
                  owner_gid: null,
                  name:'idea2@acme',
                  title:'the 2nd idea of inventor2@acme',
                  permitted:'DELETE,EDIT,READ'
               },
               {  id: 9,
                  name: 'shared-idea1@acme',
                  organization_id: 2,
                  owner_uid: null,
                  owner_gid: 1,
                  title: 'the 1st shared idea at acme',               
                  permitted: 'DELETE,EDIT,READ'
               },
               {
                  id: 10,
                  name: 'shared-idea2@acme',
                  organization_id: 2,
                  owner_uid: null,
                  owner_gid: 1,
                  title: 'the 2nd shared idea at acme',               
                  permitted: 'DELETE,EDIT,READ'
               },
               {
                  id: 11,
                  name: 'orphan-idea1@acme',
                  organization_id: 2,
                  owner_uid: null,
                  owner_gid: null,
                  permitted: 'DELETE,EDIT,READ',
                  title: 'the 1st orphan idea at acme'
               },
               {
                  id: 12,
                  name: 'orphan-idea2@acme',
                  organization_id: 2,
                  owner_uid: null,
                  owner_gid: null,
                  permitted: 'DELETE,EDIT,READ',
                  title: 'the 2nd orphan idea at acme'
               }
            ]`);
        });

        test('Manger at emca should be able to read all the ideas of the entire organization, even orphans', async () => {
            await checkReadAllQuery({
                    user: 'manager@emca', domain: 'IDEAS', action: 'READ',
                    checkOwnership: true
                },
                `[
               {  
                    id:5,
                    name:'idea1@emca',
                    organization_id:3,
                    owner_uid:5,
                    owner_gid:null,
                    title:'the 1st idea of inventor1@emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:6,
                    name:'idea2@emca',
                    organization_id:3,
                    owner_uid:5,
                    owner_gid:null,
                    title:'the 2nd idea of inventor1@emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:7,
                    name:'idea1@emca',
                    organization_id:3,
                    owner_uid:6,
                    owner_gid:null,
                    title:'the 1st idea of inventor2@emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:8,
                    name:'idea2@emca',
                    organization_id:3,
                    owner_uid:6,
                    owner_gid:null,
                    title:'the 2nd idea of inventor2@emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:13,
                    name:'shared-idea1@emca',
                    organization_id:3,
                    owner_uid:null,
                    owner_gid:2,
                    title:'the 1st shared idea at emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:14,
                    name:'shared-idea2@emca',
                    organization_id:3,
                    owner_uid:null,
                    owner_gid:2,
                    title:'the 2nd shared idea at emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:15,
                    name:'orphan-idea1@emca',
                    organization_id:3,
                    owner_uid:null,
                    owner_gid:null,
                    title:'the 1st orphan idea at emca',
                    permitted:'DELETE,EDIT,READ'
               },
               {  
                    id:16,
                    name:'orphan-idea2@emca',
                    organization_id:3,
                    owner_uid:null,
                    owner_gid:null,
                    title:'the 2nd orphan idea at emca',
                    permitted:'DELETE,EDIT,READ'
               }
            ]`);
        });

        test('Organization admin  should not be able to read ideas', async () => {
            await checkReadAllQuery({
                    user: 'admin@emca', domain: 'ideas', action: 'READ',
                    checkOwnership: true
                },
                `[]`
            );
        });

        test('1st reviewer at emca should be able to read shared ideas of the entire organization', async () => {
            await checkReadAllQuery({
                    user: 'reviewer1@emca', domain: 'ideas', action: 'ReAd',
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
                    columns: ['id', 'organization_id', 'name', 'permitted',
                        '(SELECT GROUP_CONCAT( g.name)  FROM groups g, user_groups ug WHERE g.id = ug.gid AND ug.uid = iii.id) as groups'],
                    checkOwnership: false
                },
                `[
               {
                  id:5,
                  organization_id:3,
                  groups: 'inventor,shared-idea-inventors',
                  name:'inventor1@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:6,
                  organization_id:3,
                  groups: 'inventor,shared-idea-inventors',
                  name:'inventor2@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:7,
                  organization_id:3,
                  groups: 'inventor,shared-idea-inventors',
                  name:'inventor3@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:8,
                  organization_id:3,
                  groups: 'idea-manager',
                  name:'manager@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:9,
                  organization_id:3,
                  groups: 'admin',
                  name:'admin@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:435,
                  organization_id:3,
                  groups: 'idea-reviewer',
                  name:'reviewer1@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:436,
                  organization_id:3,
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
                pids: '1'
            },
            {
                domain: 'paltform.com',
                id: 4,
                is_owner: 1,
                name: 'PLATFORM',
                permitted: 'CREATE,DELETE,EDIT,READ',
                pids: '1'
            },
            {
                domain: 'acme.com',
                id: 2,
                is_owner: 1,
                name: 'ACME',
                permitted: 'CREATE,DELETE,EDIT,READ',
                pids: '1'
            },
            {
                domain: 'emca.com',
                id: 3,
                is_owner: 1,
                name: 'EMCA',
                permitted: 'CREATE,DELETE,EDIT,READ',
                pids: '1'
            },
            {
                domain: 'test-hierarchy.com',
                id: 433,
                is_owner: 1,
                name: 'TEST Group hierarchy',
                permitted: 'CREATE,DELETE,EDIT,READ',
                pids: '1'
            },
            {
                domain: 'regression.test',
                id: 434,
                is_owner: 1,
                name: 'Regression test',
                permitted: 'CREATE,DELETE,EDIT,READ',
                pids: '1'
            }]`
        );
    });


    describe('Read all from IDEAS.COMMENTS', () => {
        test('1st reviewer at emca should be able to read comments on shared ideas the only (of the entire organization)', async () => {
            await checkReadAllSubQuery({
                    user: 'reviewer1@emca', domain: 'ideas.comments', action: 'READ-COMMENT_SHARED',
                    columns: ['id', 'owner_uid', 'ideas_id', 'text', 'permitted'],
                    checkOwnership: true
                    // ,organizationId: null
                },
                `[
                {
                    id: 439,
                    ideas_id: 13,
                    owner_uid: 435,
                    permitted: 'READ-COMMENT_SHARED,DELETE_OWN,EDIT_OWN,READ_OWN',
                    text: '1st comment by rewiewer1@emca on the 1st shared idea at emca'
                },
                {
                    id: 440,
                    ideas_id: 14,
                    owner_uid: 435,
                    permitted: 'READ-COMMENT_SHARED,DELETE_OWN,EDIT_OWN,READ_OWN',
                    text: '1st comment by rewiewer1@emca on the 2nd shared idea at emca'
                },
                {
                    id: 441,
                    ideas_id: 13,
                    owner_uid: 436,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer2@emca on the 1st shared idea at emca'
                },
                {
                    id: 442,
                    ideas_id: 14,
                    owner_uid: 436,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer2@emca on the 2nd shared idea at emca'
                },
                {
                    id: 443,
                    ideas_id: 13,
                    owner_uid: 5,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by inventor1@emca on the 1st shared idea at emca'
                },
                {
                    id: 444,
                    ideas_id: 14,
                    owner_uid: 5,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by inventor1@emca on the 2nd shared idea at emca'
                }
            ]`);
        });

        test('1st inventor at emca should be able to read comments on shared ideas including p2p sharing.', async () => {
            await checkReadAllSubQuery({
                    user: 'inventor1@emca', domain: 'ideas.comments', action: 'READ-COMMENT_SHARED',
                    columns: ['id', 'owner_uid', 'ideas_id', 'text', 'permitted'],
                    checkOwnership: true
                },
                `[
                {
                    id: 439,
                    ideas_id: 13,
                    owner_uid: 435,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer1@emca on the 1st shared idea at emca'
                },
                {
                    id: 440,
                    ideas_id: 14,
                    owner_uid: 435,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer1@emca on the 2nd shared idea at emca'
                },
                {
                    id: 441,
                    ideas_id: 13,
                    owner_uid: 436,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer2@emca on the 1st shared idea at emca'
                },
                {
                    id: 442,
                    ideas_id: 14,
                    owner_uid: 436,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by rewiewer2@emca on the 2nd shared idea at emca'
                },
                {
                    id: 443,
                    ideas_id: 13,
                    owner_uid: 5,
                    permitted: 'READ-COMMENT_SHARED,DELETE_OWN,EDIT_OWN',
                    text: '1st comment by inventor1@emca on the 1st shared idea at emca'
                },
                {
                    id: 444,
                    ideas_id: 14,
                    owner_uid: 5,
                    permitted: 'READ-COMMENT_SHARED,DELETE_OWN,EDIT_OWN',
                    text: '1st comment by inventor1@emca on the 2nd shared idea at emca'
                },
                {
                    id: 445,
                    ideas_id: 7,
                    owner_uid: 5,
                    permitted: 'READ-COMMENT_SHARED,DELETE_OWN,EDIT_OWN',
                    text: '1st comment by inventor1@emca on the 1st idea of inventor2@emca'
                },
                {
                    id: 447,
                    ideas_id: 7,
                    owner_uid: 6,
                    permitted: 'READ-COMMENT_SHARED',
                    text: '1st comment by inventor2@emca on the 1st idea of inventor2@emca'
                }
            ]`);
        });

    });

    describe('Read all from Permissions', () => {
        test('Organization admin should be able to read all permissions of the entire organization and builtin ones', async () => {
            await checkReadAllQuery({
                    user: 'admin@emca', domain: 'permissions', action: 'ReAd',
                    columns: ['id', 'organization_id', 'gid', 'uid', 'resource_instance', 'permitted'],
                    checkOwnership: false
                },
                `[
                {
                    id: 1,
                    organization_id: 1,
                    gid: 4,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: null
                },
                {
                    id: 433,
                    organization_id: 1,
                    gid: 3,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: null
                },
                {
                    id: 434,
                    organization_id: 1,
                    gid: 3,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: null
                },
                {
                    id: 435,
                    organization_id: 1,
                    gid: 433,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: null
                },
                {
                    id: 436,
                    organization_id: 1,
                    uid: null,
                    gid: 433,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: null
                },
                {
                    id: 437,
                    organization_id: 1,
                    gid: 1,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: null
                },
                {
                    id: 438,
                    organization_id: 1,
                    gid: 1,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: null
                },
                {
                    id: 439,
                    gid: 1,
                    uid: null,
                    organization_id: 1,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: null
                },
                {
                    id: 440,
                    organization_id: 1,
                    gid: 2,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: null
                },
                {
                    id: 443,
                    organization_id: 3,
                    gid: 100,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: 13
                },
                {
                    id: 444,
                    organization_id: 3,
                    gid: 100,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: 14
                },
                {
                    id: 445,
                    organization_id: 3,
                    gid: null,
                    uid: 5,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: 7
                },
                {
                    id: 446,
                    organization_id: 3,
                    gid: null,
                    uid: 5,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: 8
                },
                {
                    id: 447,
                    organization_id: 1,
                    gid: 433,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: 9
                },
                {
                    id: 448,
                    organization_id: 1,
                    gid: 433,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: 10
                },
                {
                    id: 449,
                    organization_id: 1,
                    gid: 433,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: 13
                },
                {
                    id: 450,
                    organization_id: 1,
                    gid: 433,
                    uid: null,
                    permitted: 'CREATE,DELETE,EDIT,READ',
                    resource_instance: 14
                }
            ]`);
        })
    })
});
