'use strict';

import {checkIsPermittedQuery, checkPermissionListQuery, checkReadAllQuery} from "./common";

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

    test('Inventor should be able to create a new idea even if ideas table is empty', async () => {
        await checkIsPermittedQuery({
                user: 'user1@regression.test',
                domain: 'EMPTY_IDEAS',
                checkOwnership: true,
                action: 'CREATE'
            },
            `[{isPermitted:'1'}]`);
    });

    test('Get permission list for a particular user should not fail if custom columns were provided', async () => {
        await checkPermissionListQuery({
                user: 'user1@regression.test',
                columns: ['id', 'domain', 'resource_instance', 'action']
            },
            `[
            {
                id: 451,
                domain: 'Ideas',
                action: 'READ_OWN',
                resource_instance: null
            },
            {
                id: 452,
                action: 'CREATE',
                domain: 'Ideas',
                resource_instance: null
            },
            {
                id: 453,
                action: 'CREATE, READ, EDIT, DELETE',
                domain: 'Empty_IDEAS',
                resource_instance: null
            }
        ]`)
    })

});
