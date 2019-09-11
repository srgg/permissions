'use strict';

import {checkReadAllQuery} from "./common";
import {getConnection} from "typeorm";

describe('Regression tests', () => {
    test('ReadAllQuery: calculated permissions should contains all the applicable resource permissions', async () => {
        // Issue: 
        const rr = await getConnection().query("SELECT id FROM users WHERE name = 'user1@regression.test'");
        const uid = rr[0].id;

        await checkReadAllQuery({
                userId: uid, domain: 'IDEAS', action: 'READ',
                columns: ['name'],
                checkOwnership: true, withRowPermissions: true
            },
            `[                           {
                    "name": "idea1@regression.test",
                    "permissions": "CREATE,READ"
               }
            ]`);
    });
});
