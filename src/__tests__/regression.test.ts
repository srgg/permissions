'use strict';

import {checkReadAllQuery} from "./common";
import {getConnection} from "typeorm";

describe('Regression tests', () => {
    test('ReadAllQuery: calculated permissions should contains all the applicable resource permissions', async () => {
        // Issue:

        await checkReadAllQuery({
                user: 'user1@regression.test', domain: 'IDEAS', action: 'READ',
                columns: ['name', 'title', 'permitted'],
                checkOwnership: true
            },
            `[                           {
                    name: 'idea1@regression.test',
                    title: 'the 1st idea of idea1@regression.test',
                    permitted: 'CREATE,READ_OWN'
               }
            ]`);
    });

    test('ReadAllQuery: READ_OWN should be handled properly', async () => {
        // Issue:
        await checkReadAllQuery({
                user: 'user1@regression.test', domain: 'IDEAS', action: 'READ_OWN',
                columns: ['name', 'title', 'permitted'],
                checkOwnership: true
            },
            `[                           {
                    name: 'idea1@regression.test',
                    permitted: 'CREATE,READ_OWN',
                    title: 'the 1st idea of idea1@regression.test'
               }
            ]`);
    });
});
