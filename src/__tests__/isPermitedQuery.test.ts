import { checkIsPermittedQuery} from "./common";

describe('domain level permissions', () => {

    test('Inventor should be able to create a new idea', async ()=> {
        await checkIsPermittedQuery({user:'inventor1@acme', domain: 'IDEAS', checkOwnership:true, action: 'CREATE'},
            `[{isPermitted:'1'}]`);
    });

    test('Inventor should be able to work on own ideas', async ()=> {
        await checkIsPermittedQuery({user:'inventor1@acme', domain: 'IDEAS', checkOwnership:true, action: 'EDIT_OWN'},
            `[{isPermitted:'1'}]`);
    });

    test('Manager should not be able to create a new idea', async ()=> {
        await checkIsPermittedQuery({user:'manager@acme', domain: 'IDEAS', checkOwnership:true, action: 'CREATE'},
            `[]`);
    });

    test('Organization admin should not be able to create a new idea', async ()=> {
        await checkIsPermittedQuery({user:'admin@emca', domain: 'IDEAS', checkOwnership:true, action: 'CREATE'},
            `[]`);
    });
});


describe('Instance level permissions', () => {
    test('2nd inventor at ACME should be able to read all the ideas shared by other inventors', async ()=> {
        await checkIsPermittedQuery({user:'inventor2@acme', domain: 'IDEAS', action: 'READ', checkOwnership:true, instanceId: 1},
            `[{isPermitted:'1'}]`);
    });

    test('2nd inventor at ACME should not be able to read any unshared ideas of any other inventor', async ()=> {
        await checkIsPermittedQuery({user:'inventor2@acme', domain: 'IDEAS', action: 'READ',  checkOwnership: true, instanceId: 2},
            `[]`);
    });

    test('Inventors should not be able to read orphan ideas', async ()=> {
        await checkIsPermittedQuery({user:'inventor2@acme', domain: 'IDEAS', action: 'READ', checkOwnership:true, instanceId: 11},
            `[]`);
    });
});

