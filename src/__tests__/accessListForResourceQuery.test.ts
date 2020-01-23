'use strict';
import {checkAccessListQuery} from "./common";

describe('Get user access list for specific resource', () => {
    test('Proper access list with default column set should be returned for a private idea', async () => {
        await checkAccessListQuery({
                resource: 'user_idea',
                resourceId: 7,
                action: 'READ'
            },
            `[
                {
                    id: 5,
                    name: "inventor1@emca",
                    organizationId: 3,
                    password: "pw1",
                    password_salt: "salt1"
                },
                {
                    id: 8,
                    name: "manager@emca",
                    organizationId: 3,
                    password: "pw4",
                    password_salt": "salt4"
                }
            ]`
        )
    });

    test('Proper access list with custom field set should be returned for a shared idea', async () => {
        await checkAccessListQuery({
                resource: 'user_idea',
                resourceId: 13,
                action: 'READ',
                columns: ['id', 'name', 'organizationId']
            },
            `[
                {
                    id: 5,
                    name: "inventor1@emca",
                    organizationId: 3
                },
                {
                    id: 6,
                    name: "inventor2@emca",
                    organizationId: 3
                },
                {
                    id: 7,
                    name: "inventor3@emca",
                    organizationId": 3
                },
                {
                    id: 8,
                    name: "manager@emca",
                    organizationId: 3
                },
                {
                    id: 435,
                    name: "reviewer1@emca",
                    organizationId: 3
                },
                {
                    id: 436,
                    name: "reviewer2@emca",
                    organizationId": 3
                }
            ]`);
    });

    test('Proper access list with custom field set w/o checking ownership should be returned for a builtin group', async () => {
        await checkAccessListQuery({
            resource: 'group',
            resourceId: 1,
            action: 'READ',
            checkOwnership: false,
            organizationId: 3,
            columns: ['id', 'name', 'organizationId']
        }, `[
            {
                id: 9,
                name: "admin@emca",
                organizationId: 3
           }
        ]`);
    });
});
