'use strict';

// https://houbb.github.io/2016/08/11/shiro
// https://stackoverflow.com/questions/20215744/how-to-create-a-mysql-hierarchical-recursive-query
// https://blog.morizyun.com/javascript/library-typescript-jest-unit-test.html

import { getConnection} from "typeorm";
import {BuildAllResourceQueryParams, QueryBuilder} from '../QueryBuilder';

async function check_query(queryopts: BuildAllResourceQueryParams, expected: string) {
    const q = QueryBuilder.buildDomainQuery(queryopts);

    const r = await getConnection().query(q.query, q.params);
    expect(r).toEqual(JSON.parse(expected));
}

describe('Instance level permissions', () => {

    test('1st inventor should be able to read the only own ideas', async () => {
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
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor1@acme",
                  "permissions":"READ,CREATE,EDIT,DELETE"
                },
                {
                  "id":2,
                  "organization_id":2,
                  "owner_id":1,
                  "name":"idea2@acme",
                  "title":"the 2nd idea of inventor1@acme",
                  "permissions":"READ,CREATE,EDIT,DELETE"
                }
            ]`);
    });

    test('2nd inventor should be able to read his own ideas as well as an idea shared by the first inventor', async () => {
        await check_query({
                userId: 2, resource: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[
               {
                  "id":3,
                  "organization_id":2,
                  "owner_id":2,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor2@acme",
                  "permissions":"READ,CREATE,EDIT,DELETE"
               },
               {
                  "id":4,
                  "organization_id":2,
                  "owner_id":2,
                  "name":"idea2@acme",
                  "title":"the 2nd idea of inventor2@acme",
                  "permissions":"READ,CREATE,EDIT,DELETE"
               },
               {
                  "id":1,
                  "organization_id":2,
                  "owner_id":1,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor1@acme",
                  "permissions":"READ,CREATE"
               }
            ]`);
    });

    test('3rd inventor should not be able to read anything as he has none of own and shared ideas', async () => {
        await check_query({
                userId: 3, resource: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[]`);
    });

    test('Manger should be able to read all the ideas of the entire organization', async () => {
        await check_query({
                userId: 4, resource: 'IDEAS', action: 'READ',
                checkOwnership: true, withRowPermissions: true
            },
            `[
               {
                  "id":1,
                  "organization_id":2,
                  "owner_id":1,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor1@acme",
                  "permissions":"READ,EDIT,DELETE"
               },
               {
                  "id":2,
                  "organization_id":2,
                  "owner_id":1,
                  "name":"idea2@acme",
                  "title":"the 2nd idea of inventor1@acme",
                  "permissions":"READ,EDIT,DELETE"
               },
               {
                  "id":3,
                  "organization_id":2,
                  "owner_id":2,
                  "name":"idea1@acme",
                  "title":"the 1st idea of inventor2@acme",
                  "permissions":"READ,EDIT,DELETE"
               },
               {
                  "id":4,
                  "organization_id":2,
                  "owner_id":2,
                  "name":"idea2@acme",
                  "title":"the 2nd idea of inventor2@acme",
                  "permissions":"READ,EDIT,DELETE"
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
                  "permissions":"READ,CREATE,EDIT,DELETE"
               },
               {
                  "id":6,
                  "organization_id":3,
                  "name":"inventor2@emca",
                  "permissions":"READ,CREATE,EDIT,DELETE"
               },
               {
                  "id":7,
                  "organization_id":3,
                  "name":"inventor3@emca",
                  "permissions":"READ,CREATE,EDIT,DELETE"
               },
               {
                  "id":8,
                  "organization_id":3,
                  "name":"manager@emca",
                  "permissions":"READ,CREATE,EDIT,DELETE"
               },
               {
                  "id":9,
                  "organization_id":3,
                  "name":"admin@emca",
                  "permissions":"READ,CREATE,EDIT,DELETE"
               }
            ]`);
    });
});
