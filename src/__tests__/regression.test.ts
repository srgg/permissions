'use strict';

import {checkReadAllQuery} from "./common";
import {getConnection} from "typeorm";

describe('Regression tests', () => {
    var uid;
    beforeAll(async () => {
        const rr = await getConnection().query("SELECT id FROM users WHERE name = 'user1@regression.test'");
        uid = rr[0].id;
    });

    test('ReadAllQuery: calculated permissions should contains all the applicable resource permissions', async () => {
        // Issue:

        await checkReadAllQuery({
                userId: uid, domain: 'IDEAS', action: 'READ',
                columns: ['name', 'title'],
                checkOwnership: true, withRowPermissions: true
            },
            `[                           {
                    "name": "idea1@regression.test",
                    "title": "the 1st idea of idea1@regression.test",
                    "permissions": "CREATE,READ"
               }
            ]`);
    });

    test('ReadAllQuery: READ_OWN should be handled properly', async () => {
        // Issue:
        await checkReadAllQuery({
                userId: uid, domain: 'IDEAS', action: 'READ_OWN',
                columns: ['name', 'title'],
                checkOwnership: true, withRowPermissions: true
            },
            `[                           {
                    "name": "idea1@regression.test",
                    "permissions": "CREATE,READ",
                    "title": "the 1st idea of idea1@regression.test"
               }
            ]`);
    });
});
