import {IsPermittedQueryParams, QueryBuilder} from "../QueryBuilder";
import {getConnection} from "typeorm";

interface IsPermittedQueryParamsTest {
    userId: number;
    domain: string;
    action: string;
    organizationId?: number;
    instanceId?: number;
}

async function check_query(queryopts: IsPermittedQueryParamsTest, expected: string) {
    let orgId;
    if (queryopts.organizationId) {
        orgId = queryopts.organizationId;
    } else {
        const rr = await getConnection().query("SELECT organization_id FROM users WHERE id = " + queryopts.userId);
        orgId = rr[0].organization_id;
    }

    const q = QueryBuilder.buildIsPermittedQuery({
        userId: queryopts.userId,
        domain: queryopts.domain,
        action: queryopts.action,
        organizationId: orgId,
        instanceId: queryopts.instanceId
    });

    const r = await getConnection().query(q.query, q.params);
    expect(r).toEqual(JSON.parse(expected));
}

describe('domain level permissions', () => {

    test('Inventor should be able to create a new idea', async ()=> {
        await check_query({userId:1, domain: 'IDEAS', action: 'CREATE'},
            `[{"isPermitted":"1"}]`);
    });

    test('Inventor should be able to work on own ideas', async ()=> {
        await check_query({userId:1, domain: 'IDEAS', action: 'EDIT_OWN'},
            `[{"isPermitted":"1"}]`);
    });

    test('Manager should not be able to create a new idea', async ()=> {
        await check_query({userId:4, domain: 'IDEAS', action: 'CREATE'},
            `[]`);
    });

    test('Organization admin should not be able to create a new idea', async ()=> {
        await check_query({userId:9, domain: 'IDEAS', action: 'CREATE'},
            `[]`);
    });
});


