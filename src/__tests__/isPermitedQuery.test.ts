import { checkIsPermittedQuery} from "./common";

describe('domain level permissions', () => {

    test('Inventor should be able to create a new idea', async ()=> {
        await checkIsPermittedQuery({
                user: 'inventor1@acme',
                domain: 'USER_IDEA',
                checkOwnership: true,
                action: 'CREATE'
            },
            `[{isPermitted:'1'}]`);
    });

    test('Inventor should be able to work on own ideas', async ()=> {
        await checkIsPermittedQuery({
                user: 'inventor1@acme',
                domain: 'USER_IDEA',
                checkOwnership: true,
                action: 'EDIT_OWN'
            },
            `[{isPermitted:'1'}]`);
    });

    test('Inventors should not be able to read permissions', async ()=> {
        await checkIsPermittedQuery({user: 'inventor2@acme', domain: 'PERMISSION', action: 'READ'},
            `[]`);
    });

    test('Manager should not be able to create a new idea', async ()=> {
        await checkIsPermittedQuery({user: 'manager@acme', domain: 'USER_IDEA', checkOwnership: true, action: 'CREATE'},
            `[]`);
    });

    test('Organization admin should not be able to create a new idea', async ()=> {
        await checkIsPermittedQuery({user: 'admin@emca', domain: 'USER_IDEA', checkOwnership: true, action: 'CREATE'},
            `[]`);
    });

    test('Organization admin should be able to create a new permission', async ()=> {
        await checkIsPermittedQuery({user: 'admin@emca', domain: 'PERMISSION', action: 'CREATE'},
            `[{isPermitted:'1'}]`);
    });

    test('Organization admin should be able to read permissions', async ()=> {
        await checkIsPermittedQuery({user: 'admin@emca', domain: 'PERMISSION', action: 'READ'},
            `[{isPermitted:'1'}]`);
    });
});


describe('Instance level permissions', () => {
    test('2nd inventor at ACME should be able to read all the ideas shared by other inventors', async ()=> {
        await checkIsPermittedQuery({
                user: 'inventor2@acme',
                domain: 'USER_IDEA',
                action: 'READ',
                checkOwnership: true,
                resourceId: 1
            },
            `[{isPermitted:'1'}]`);
    });

    test('2nd inventor at ACME should not be able to read any unshared ideas of any other inventor', async ()=> {
        await checkIsPermittedQuery({
                user: 'inventor2@acme',
                domain: 'USER_IDEA',
                action: 'READ',
                checkOwnership: true,
                resourceId: 2
            },
            `[]`);
    });

    test('Inventors should not be able to read orphan ideas', async ()=> {
        await checkIsPermittedQuery({
                user: 'inventor2@acme',
                domain: 'USER_IDEA',
                action: 'READ',
                checkOwnership: true,
                resourceId: 11
            },
            `[]`);
    });

    test('Inventor should be able to work on correspondent own idea', async () => {
        await checkIsPermittedQuery({
                user: 'inventor1@acme', domain: 'USER_IDEA', resourceId: 1,
                checkOwnership: true, action: 'EDIT_OWN'
            },
            `[{isPermitted:'1'}]`);
    });

    test('Inventor should not be able to work on private idea owned by another inventor', async () => {
        await checkIsPermittedQuery({
                user: 'manager@acme', domain: 'USER_IDEA', resourceId: 3,
                checkOwnership: true, action: 'EDIT_OWN'
            },
            `[]`);
    });

    test('Organization admin should be able to read particular builtin permission', async () => {
        await checkIsPermittedQuery({user: 'admin@emca', domain: 'PERMISSION', action: 'READ', resourceId: 433},
            `[{isPermitted:'1'}]`);
    });

    test('Inventor should be able to CREATE new idea', async () => {
        await checkIsPermittedQuery({
                user: 'inventor2@acme', domain: 'USER_IDEA',
                checkOwnership: true, action: 'CREATE'
            },
            `[{isPermitted:'1'}]`);
    });

    test('Inventor should have CREATE permission on any permitted idea (that includes shared ideas too) within organization', async () => {
        await checkIsPermittedQuery({
                user: 'inventor2@acme', domain: 'USER_IDEA', resourceId: 1,
                checkOwnership: true, action: 'CREATE'
            },
            `[{isPermitted:'1'}]`);
    });

    test('Inventor should not have CREATE permission on any idea from another organization', async () => {
        await checkIsPermittedQuery({
                user: 'inventor2@acme', domain: 'USER_IDEA', resourceId: 5,
                checkOwnership: true, action: 'CREATE'
            },
            `[]`);
    });

});

