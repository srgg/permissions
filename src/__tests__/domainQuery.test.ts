'use strict';

// https://houbb.github.io/2016/08/11/shiro
// https://stackoverflow.com/questions/20215744/how-to-create-a-mysql-hierarchical-recursive-query
// https://blog.morizyun.com/javascript/library-typescript-jest-unit-test.html

import { getConnection} from "typeorm";
import {DomainParams, QueryBuilder} from '../QueryBuilder';

function compare(a,b): number {
    return (a.id > b.id) ? 1 : -11
};

interface BuildAllResourceQueryParamsTest extends DomainParams {
    columns?: string[];
    checkOwnership?: boolean;
    withRowPermissions?: boolean;
}

async function check_query(queryopts: BuildAllResourceQueryParamsTest, expected: string) {
    const rr = await getConnection().query("SELECT organization_id FROM users WHERE id = " + queryopts.userId);
    const orgId = rr[0].organization_id;

    if ( !queryopts.columns && queryopts.resource === 'IDEAS') {
        queryopts.columns = ['id','name','organization_id', 'owner_id', 'owner_role_id', 'title'];
    }

    const q = QueryBuilder.buildDomainQuery({userId: queryopts.userId,
        resource: queryopts.resource,
        action: queryopts.action,
        organizationId: orgId,
        columns: queryopts.columns,
        withRowPermissions: queryopts.withRowPermissions,
        checkOwnership: queryopts.checkOwnership
    });

    const r = await getConnection().query(q.query, q.params);
    expect(r.sort(compare)).toEqual(JSON.parse(expected).sort(compare));
}

describe('Instance level permissions', () => {

    test('1st inventor should be able to read own ideas as well as all ideas shared to group', async () => {
        await check_query({
                userId: 1, resource: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `
            [
                {
                  "id": 1,
                  "organization_id":2,
                  "owner_id":1,
                  "owner_role_id": null,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor1@acme",
                  "permissions":"CREATE,DELETE,EDIT,READ"
                },
                {
                  "id":2,
                  "organization_id":2,
                  "owner_id":1,
                  "owner_role_id": null,
                  "name":"idea2@acme",
                  "title":"the 2nd idea of inventor1@acme",
                  "permissions":"CREATE,DELETE,EDIT,READ"
                },
               {   "id": 9,
                    "name": "shared-idea1@acme",
                    "organization_id": 2,
                    "owner_id": null,
                    "owner_role_id": 1,
                    "title": "the 1st shared idea at acme",               
                    "permissions": "CREATE,DELETE,EDIT,READ"
               },
               {
                    "id": 10,
                    "name": "shared-idea2@acme",
                    "organization_id": 2,
                    "owner_id": null,
                    "owner_role_id": 1,
                    "title": "the 2nd shared idea at acme",               
                    "permissions": "CREATE,DELETE,EDIT,READ"
               }                
            ]`);
    });

    test('2nd inventor should be able to read his own ideas as well as an idea shared by the first inventor and all ideas shared to group', async () => {
        await check_query({
                userId: 2, resource: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[
               {
                  "id":3,
                  "organization_id":2,
                  "owner_id":2,
                  "owner_role_id": null,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor2@acme",
                  "permissions":"CREATE,DELETE,EDIT,READ"
               },
               {
                  "id":4,
                  "organization_id":2,
                  "owner_id":2,
                  "owner_role_id": null,
                  "name":"idea2@acme",
                  "title":"the 2nd idea of inventor2@acme",
                  "permissions":"CREATE,DELETE,EDIT,READ"
               },
               {
                  "id":1,
                  "organization_id":2,
                  "owner_id":1,
                  "owner_role_id": null,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor1@acme",
                  "permissions":"READ"
               },
               {   "id": 9,
                    "name": "shared-idea1@acme",
                    "organization_id": 2,
                    "owner_id": null,
                    "owner_role_id": 1,
                    "title": "the 1st shared idea at acme",               
                    "permissions": "CREATE,DELETE,EDIT,READ"
               },
               {
                    "id": 10,
                    "name": "shared-idea2@acme",
                    "organization_id": 2,
                    "owner_id": null,
                    "owner_role_id": 1,
                    "title": "the 2nd shared idea at acme",               
                    "permissions": "CREATE,DELETE,EDIT,READ"
               }               
            ]`);
    });

    test('3rd inventor should be able to read the only ideas shared to role/group, as he has none of own ideas', async () => {
        await check_query({
                userId: 3, resource: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[
               {   "id": 9,
                    "name": "shared-idea1@acme",
                    "organization_id": 2,
                    "owner_id": null,
                    "owner_role_id": 1,
                    "title": "the 1st shared idea at acme",               
                    "permissions": "CREATE,DELETE,EDIT,READ"
               },
               {
                    "id": 10,
                    "name": "shared-idea2@acme",
                    "organization_id": 2,
                    "owner_id": null,
                    "owner_role_id": 1,
                    "title": "the 2nd shared idea at acme",               
                    "permissions": "CREATE,DELETE,EDIT,READ"
               }
            ]`);
    });

    test('Inventors at emca should not be able to Delete ideas shared to role/group', async () => {
        await check_query({
                userId: 7, resource: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[
               {   "id": 13,
                    "name": "shared-idea1@emca",
                    "organization_id": 3,
                    "owner_id": null,
                    "owner_role_id": 4,
                    "title": "the 1st shared idea at emca",               
                    "permissions": "EDIT,READ"
               },
               {
                    "id": 14,
                    "name": "shared-idea2@emca",
                    "organization_id": 3,
                    "owner_id": null,
                    "owner_role_id": 4,
                    "title": "the 2nd shared idea at emca",               
                    "permissions": "EDIT,READ"
               }
            ]`);
    });

    test('Manger should be able to read all the ideas of the entire organization, even orphans', async () => {
        await check_query({
                userId: 4, resource: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[
               {
                  "id":1,
                  "organization_id":2,
                  "owner_id":1,
                  "owner_role_id": null,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor1@acme",
                  "permissions":"DELETE,EDIT,READ"
               },
               {
                  "id":2,
                  "organization_id":2,
                  "owner_id":1,
                  "owner_role_id": null,
                  "name":"idea2@acme",
                  "title":"the 2nd idea of inventor1@acme",
                  "permissions":"DELETE,EDIT,READ"
               },
               {
                  "id":3,
                  "organization_id":2,
                  "owner_id":2,
                  "owner_role_id": null,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor2@acme",
                  "permissions":"DELETE,EDIT,READ"
               },
               {
                  "id":4,
                  "organization_id":2,
                  "owner_id":2,
                  "owner_role_id": null,
                  "name":"idea2@acme",
                  "title":"the 2nd idea of inventor2@acme",
                  "permissions":"DELETE,EDIT,READ"
               },
               {   "id": 9,
                    "name": "shared-idea1@acme",
                    "organization_id": 2,
                    "owner_id": null,
                    "owner_role_id": 1,
                    "title": "the 1st shared idea at acme",               
                    "permissions": "DELETE,EDIT,READ"
               },
               {
                    "id": 10,
                    "name": "shared-idea2@acme",
                    "organization_id": 2,
                    "owner_id": null,
                    "owner_role_id": 1,
                    "title": "the 2nd shared idea at acme",               
                    "permissions": "DELETE,EDIT,READ"
               },
               {
                    "id": 11,
                    "name": "orphan-idea1@acme",
                    "organization_id": 2,
                    "owner_id": null,
                    "owner_role_id": null,
                    "permissions": "DELETE,EDIT,READ",
                    "title": "the 1st orphan idea at acme"
               },
               {
                    "id": 12,
                    "name": "orphan-idea2@acme",
                    "organization_id": 2,
                    "owner_id": null,
                    "owner_role_id": null,
                    "permissions": "DELETE,EDIT,READ",
                    "title": "the 2nd orphan idea at acme"
               }
            ]`);
    });

    test('Manger at emca should be able to read all the ideas of the entire organization, even orphans', async () => {
        await check_query({
                userId: 8, resource: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[
               {  
                    "id":5,
                    "name":"idea1@emca",
                    "organization_id":3,
                    "owner_id":5,
                    "owner_role_id":null,
                    "title":"the 1st idea of inventor1@emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":6,
                    "name":"idea2@emca",
                    "organization_id":3,
                    "owner_id":5,
                    "owner_role_id":null,
                    "title":"the 2nd idea of inventor1@emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":7,
                    "name":"idea1@emca",
                    "organization_id":3,
                    "owner_id":5,
                    "owner_role_id":null,
                    "title":"the 1st idea of inventor2@emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":8,
                    "name":"idea2@emca",
                    "organization_id":3,
                    "owner_id":6,
                    "owner_role_id":null,
                    "title":"the 2nd idea of inventor2@emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":13,
                    "name":"shared-idea1@emca",
                    "organization_id":3,
                    "owner_id":null,
                    "owner_role_id":4,
                    "title":"the 1st shared idea at emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":14,
                    "name":"shared-idea2@emca",
                    "organization_id":3,
                    "owner_id":null,
                    "owner_role_id":4,
                    "title":"the 2nd shared idea at emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":15,
                    "name":"orphan-idea1@emca",
                    "organization_id":3,
                    "owner_id":null,
                    "owner_role_id":null,
                    "title":"the 1st orphan idea at emca",
                    "permissions":"DELETE,EDIT,READ"
               },
               {  
                    "id":16,
                    "name":"orphan-idea2@emca",
                    "organization_id":3,
                    "owner_id":null,
                    "owner_role_id":null,
                    "title":"the 2nd orphan idea at emca",
                    "permissions":"DELETE,EDIT,READ"
               }
            ]`);
    });

    test('Inventor should not be able to read users', async () => {
        await check_query({
                userId: 1, resource: 'users', action: 'READ',
                checkOwnership: false, withRowPermissions: true
            },
            `[]`
        );
    });

    test('Manager should not be able to read users', async () => {
        await check_query({
                userId: 4, resource: 'users', action: 'READ',
                checkOwnership: false, withRowPermissions: true
            },
            `[]`
        );
    });

    test('Organization admin  should not be able to read ideas', async () => {
        await check_query({
                userId: 9, resource: 'ideas', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[]`
        );
    });

    test('Organization admin should be able to read all users of the entire organization', async () => {
        await check_query({
                userId: 9, resource: 'users', action: 'ReAd',
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
