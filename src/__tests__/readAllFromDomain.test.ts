'use strict';

// https://houbb.github.io/2016/08/11/shiro
// https://stackoverflow.com/questions/20215744/how-to-create-a-mysql-hierarchical-recursive-query
// https://blog.morizyun.com/javascript/library-typescript-jest-unit-test.html

import { checkReadAllQuery} from "./common";

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
                    permitted: 'CREATE,EDIT,READ'
                  },
                  {
                    id: 13,
                    name: 'shared-idea1@emca',
                    organization_id: 3,
                    owner_uid: null,
                    owner_gid: 2,
                    title: 'the 1st shared idea at emca',
                    permitted: 'CREATE,EDIT_SHARED,READ,READ_SHARED'
                  },
                  {
                    id: 14,
                    name: 'shared-idea2@emca',
                    organization_id: 3,
                    owner_uid: null,
                    owner_gid: 2,
                    title: 'the 2nd shared idea at emca',
                    permitted: 'CREATE,EDIT_SHARED,READ,READ_SHARED'
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

        test('Organization admin should be able to read all users of the entire organization', async () => {
            await checkReadAllQuery({
                    user: 'admin@emca', domain: 'users', action: 'ReAd',
                    columns: ['id', 'organization_id', 'name', 'permitted'],
                    checkOwnership: false
                },
                `[
               {
                  id:5,
                  organization_id:3,
                  name:'inventor1@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:6,
                  organization_id:3,
                  name:'inventor2@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:7,
                  organization_id:3,
                  name:'inventor3@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:8,
                  organization_id:3,
                  name:'manager@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:9,
                  organization_id:3,
                  name:'admin@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:433,
                  organization_id:3,
                  name:'reviewer1@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               },
               {
                  id:434,
                  organization_id:3,
                  name:'reviewer2@emca',
                  permitted:'CREATE,DELETE,EDIT,READ'
               }
            ]`);
        });
    });
});
