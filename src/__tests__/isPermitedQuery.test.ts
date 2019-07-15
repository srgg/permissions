import {BuildAllResourceQueryParams, QueryBuilder} from "../QueryBuilder";
import {getConnection} from "typeorm";

async function check_query(queryopts: BuildAllResourceQueryParams, expected: string) {
    const q = QueryBuilder.buildIsPermittedQuery(queryopts);

    const r = await getConnection().query(q.query, q.params);
    expect(r).toEqual(JSON.parse(expected));
}

describe('domain level permissions', () => {

    test('Inventor should be able to create a new idea', async ()=> {
        await check_query({userId:1, resource: 'IDEAS', action: 'CREATE'},
            `[{"isPermitted":"1"}]`);
    });

    test('Inventor should be able to work on own ideas', async ()=> {
        await check_query({userId:1, resource: 'IDEAS', action: 'EDIT_OWN'},
            `[{"isPermitted":"1"}]`);
    });

    test('Manager should not be able to create a new idea', async ()=> {
        await check_query({userId:4, resource: 'IDEAS', action: 'CREATE'},
            `[]`);
    });

    test('Organization admin should not be able to create a new idea', async ()=> {
        await check_query({userId:9, resource: 'IDEAS', action: 'CREATE'},
            `[]`);
    });
});


