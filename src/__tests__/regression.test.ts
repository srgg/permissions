'use strict';

import {checkIsPermittedQuery, checkPermissionListQuery, checkReadAllQuery} from "./common";

describe('Regression tests', () => {
    test('ReadAllQuery: calculated permissions should contains all the applicable resource permissions', async () => {
        // Issue:

        await checkReadAllQuery({
                user: 'user1@regression.test', domain: 'USER_IDEA', action: 'READ',
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
                user: 'user1@regression.test', domain: 'USER_IDEA', action: 'READ_OWN',
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
                columns: ['id', 'resource', 'resourceId', 'actions']
            },
            `[
            {
                id: 452,
                resource: 'User_Idea',
                actions: 'READ_OWN',
                resourceId: null
            },
            {
                id: 453,
                actions: 'CREATE',
                resource: 'User_Idea',
                resourceId: null
            },
            {
                id: 454,
                actions: 'CREATE, READ, EDIT, DELETE',
                resource: 'Empty_IDEAS',
                resourceId: null
            }
        ]`)
    })

});
