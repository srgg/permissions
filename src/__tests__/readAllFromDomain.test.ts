'use strict';

// https://houbb.github.io/2016/08/11/shiro
// https://stackoverflow.com/questions/20215744/how-to-create-a-mysql-hierarchical-recursive-query
// https://blog.morizyun.com/javascript/library-typescript-jest-unit-test.html

import { checkReadAllQuery} from "./common";

describe('Read all from domain', () => {

    test('1st inventor should be able to read own ideas as well as all ideas shared to group', async () => {
        await checkReadAllQuery({
                userId: 1, domain: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `
            [
                {
                  "id": 1,
                  "organization_id":2,
                  "owner_uid":1,
                  "owner_gid": null,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor1@acme",
                  "permissions":"CREATE,CREATE_COMMENT,DELETE,EDIT,READ_COMMENT,READ"
                },
                {
                  "id":2,
                  "organization_id":2,
                  "owner_uid":1,
                  "owner_gid": null,
                  "name":"idea2@acme",
                  "title":"the 2nd idea of inventor1@acme",
                  "permissions":"CREATE,CREATE_COMMENT,DELETE,EDIT,READ_COMMENT,READ"
                },
               {   "id": 9,
                    "name": "shared-idea1@acme",
                    "organization_id": 2,
                    "owner_uid": null,
                    "owner_gid": 1,
                    "title": "the 1st shared idea at acme",               
                    "permissions": "CREATE,CREATE_COMMENT,DELETE,EDIT,READ_COMMENT,READ"
               },
               {
                    "id": 10,
                    "name": "shared-idea2@acme",
                    "organization_id": 2,
                    "owner_uid": null,
                    "owner_gid": 1,
                    "title": "the 2nd shared idea at acme",               
                    "permissions": "CREATE,CREATE_COMMENT,DELETE,EDIT,READ_COMMENT,READ"
               }                
            ]`);
    });

    test('2nd inventor should be able to read his own ideas as well as an idea shared by the first inventor and all ideas shared to group', async () => {
        await checkReadAllQuery({
                userId: 2, domain: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[
               {
                  "id":1,
                  "organization_id":2,
                  "owner_uid":1,
                  "owner_gid": null,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor1@acme",
                  "permissions":"CREATE_COMMENT,READ_COMMENT,READ"
               },
               {
                  "id":3,
                  "organization_id":2,
                  "owner_uid":2,
                  "owner_gid": null,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor2@acme",
                  "permissions":"CREATE,CREATE_COMMENT,DELETE,EDIT,READ_COMMENT,READ"
               },
               {
                  "id":4,
                  "organization_id":2,
                  "owner_uid":2,
                  "owner_gid": null,
                  "name":"idea2@acme",
                  "title":"the 2nd idea of inventor2@acme",
                  "permissions":"CREATE,CREATE_COMMENT,DELETE,EDIT,READ_COMMENT,READ"
               },
               {   "id": 9,
                    "name": "shared-idea1@acme",
                    "organization_id": 2,
                    "owner_uid": null,
                    "owner_gid": 1,
                    "title": "the 1st shared idea at acme",               
                    "permissions": "CREATE,DELETE,EDIT,READ"
               },
               {
                    "id": 10,
                    "name": "shared-idea2@acme",
                    "organization_id": 2,
                    "owner_uid": null,
                    "owner_gid": 1,
                    "title": "the 2nd shared idea at acme",               
                    "permissions": "CREATE,DELETE,EDIT,READ"
               }               
            ]`);
    });

    test('3rd inventor should be able to read the only ideas shared to role/group, as he has none of own ideas', async () => {
        await checkReadAllQuery({
                userId: 3, domain: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[
               {   "id": 9,
                    "name": "shared-idea1@acme",
                    "organization_id": 2,
                    "owner_uid": null,
                    "owner_gid": 1,
                    "title": "the 1st shared idea at acme",               
                    "permissions": "CREATE,CREATE_COMMENT,DELETE,EDIT,READ_COMMENT,READ"
               },
               {
                    "id": 10,
                    "name": "shared-idea2@acme",
                    "organization_id": 2,
                    "owner_uid": null,
                    "owner_gid": 1,
                    "title": "the 2nd shared idea at acme",               
                    "permissions": "CREATE,CREATE_COMMENT,DELETE,EDIT,READ_COMMENT,READ"
               }
            ]`);
    });

    test('Inventors at emca should not be able to Delete ideas shared to role/group', async () => {
        await checkReadAllQuery({
                userId: 7, domain: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[
               {   "id": 13,
                    "name": "shared-idea1@emca",
                    "organization_id": 3,
                    "owner_uid": null,
                    "owner_gid": 100,
                    "title": "the 1st shared idea at emca",               
                    "permissions": "CREATE,CREATE_COMMENT,DELETE,EDIT,READ_COMMENT,READ"
               },
               {
                    "id": 14,
                    "name": "shared-idea2@emca",
                    "organization_id": 3,
                    "owner_uid": null,
                    "owner_gid": 100,
                    "title": "the 2nd shared idea at emca",               
                    "permissions": "CREATE,CREATE_COMMENT,DELETE,EDIT,READ_COMMENT,READ"
               }
            ]`);
    });

    test('Manger should be able to read all the ideas of the entire organization, even orphans', async () => {
        await checkReadAllQuery({
                userId: 4, domain: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[
               {
                  "id":1,
                  "organization_id":2,
                  "owner_uid":1,
                  "owner_gid": null,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor1@acme",
                  "permissions":"DELETE,EDIT,READ"
               },
               {
                  "id":2,
                  "organization_id":2,
                  "owner_uid":1,
                  "owner_gid": null,
                  "name":"idea2@acme",
                  "title":"the 2nd idea of inventor1@acme",
                  "permissions":"DELETE,EDIT,READ"
               },
               {
                  "id":3,
                  "organization_id":2,
                  "owner_uid":2,
                  "owner_gid": null,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor2@acme",
                  "permissions":"DELETE,EDIT,READ"
               },
               {
                  "id":4,
                  "organization_id":2,
                  "owner_uid":2,
                  "owner_gid": null,
                  "name":"idea2@acme",
                  "title":"the 2nd idea of inventor2@acme",
                  "permissions":"DELETE,EDIT,READ"
               },
               {   "id": 9,
                    "name": "shared-idea1@acme",
                    "organization_id": 2,
                    "owner_uid": null,
                    "owner_gid": 1,
                    "title": "the 1st shared idea at acme",               
                    "permissions": "DELETE,EDIT,READ"
               },
               {
                    "id": 10,
                    "name": "shared-idea2@acme",
                    "organization_id": 2,
                    "owner_uid": null,
                    "owner_gid": 1,
                    "title": "the 2nd shared idea at acme",               
                    "permissions": "DELETE,EDIT,READ"
               },
               {
                    "id": 11,
                    "name": "orphan-idea1@acme",
                    "organization_id": 2,
                    "owner_uid": null,
                    "owner_gid": null,
                    "permissions": "DELETE,EDIT,READ",
                    "title": "the 1st orphan idea at acme"
               },
               {
                    "id": 12,
                    "name": "orphan-idea2@acme",
                    "organization_id": 2,
                    "owner_uid": null,
                    "owner_gid": null,
                    "permissions": "DELETE,EDIT,READ",
                    "title": "the 2nd orphan idea at acme"
               }
            ]`);
    });

    test('Manger at emca should be able to read all the ideas of the entire organization, even orphans', async () => {
        await checkReadAllQuery({
                userId: 8, domain: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[
               {  
                    "id":5,
                    "name":"idea1@emca",
                    "organization_id":3,
                    "owner_uid":5,
                    "owner_gid":null,
                    "title":"the 1st idea of inventor1@emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":6,
                    "name":"idea2@emca",
                    "organization_id":3,
                    "owner_uid":5,
                    "owner_gid":null,
                    "title":"the 2nd idea of inventor1@emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":7,
                    "name":"idea1@emca",
                    "organization_id":3,
                    "owner_uid":5,
                    "owner_gid":null,
                    "title":"the 1st idea of inventor2@emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":8,
                    "name":"idea2@emca",
                    "organization_id":3,
                    "owner_uid":6,
                    "owner_gid":null,
                    "title":"the 2nd idea of inventor2@emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":13,
                    "name":"shared-idea1@emca",
                    "organization_id":3,
                    "owner_uid":null,
                    "owner_gid":100,
                    "title":"the 1st shared idea at emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":14,
                    "name":"shared-idea2@emca",
                    "organization_id":3,
                    "owner_uid":null,
                    "owner_gid":100,
                    "title":"the 2nd shared idea at emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":15,
                    "name":"orphan-idea1@emca",
                    "organization_id":3,
                    "owner_uid":null,
                    "owner_gid":null,
                    "title":"the 1st orphan idea at emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":16,
                    "name":"orphan-idea2@emca",
                    "organization_id":3,
                    "owner_uid":null,
                    "owner_gid":null,
                    "title":"the 2nd orphan idea at emca",
                    "permissions":"DELETE,EDIT,READ"
               }
            ]`);
    });

    test('Inventor should not be able to read users', async () => {
        await checkReadAllQuery({
                userId: 1, domain: 'users', action: 'READ',
                checkOwnership: false, withRowPermissions: true
            },
            `[]`
        );
    });

    test('Manager should not be able to read users', async () => {
        await checkReadAllQuery({
                userId: 4, domain: 'users', action: 'READ',
                checkOwnership: false, withRowPermissions: true
            },
            `[]`
        );
    });

    test('Organization admin  should not be able to read ideas', async () => {
        await checkReadAllQuery({
                userId: 9, domain: 'ideas', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[]`
        );
    });

    test('Organization admin should be able to read all users of the entire organization', async () => {
        await checkReadAllQuery({
                userId: 9, domain: 'users', action: 'ReAd',
                columns: ['id', 'organization_id', 'name'],
                checkOwnership: false, withRowPermissions: true
            },
            `[
               {
                  "id":5,
                  "organization_id":3,
                  "name":"inventor1@emca",
                  "permissions":"CREATE,DELETE,EDIT,READ"
               },
               {
                  "id":6,
                  "organization_id":3,
                  "name":"inventor2@emca",
                  "permissions":"CREATE,DELETE,EDIT,READ"
               },
               {
                  "id":7,
                  "organization_id":3,
                  "name":"inventor3@emca",
                  "permissions":"CREATE,DELETE,EDIT,READ"
               },
               {
                  "id":8,
                  "organization_id":3,
                  "name":"manager@emca",
                  "permissions":"CREATE,DELETE,EDIT,READ"
               },
               {
                  "id":9,
                  "organization_id":3,
                  "name":"admin@emca",
                  "permissions":"CREATE,DELETE,EDIT,READ"
               }
            ]`);
    });
});
