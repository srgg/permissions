import {getConnection} from "typeorm";
import {QueryBuilder} from "../QueryBuilder";


function compareIt(a,b): number {
    return (a.id > b.id) ? 1 : -11
}

interface BuildAllResourceQueryParamsTest {
    userId: number;
    domain: string;
    action: string;
    organizationId?: number;
    columns?: string[];
    checkOwnership?: boolean;
    withRowPermissions?: boolean;
}

async function check_read_all_query(queryopts: BuildAllResourceQueryParamsTest, expected: string) {
    if ( !queryopts.columns && queryopts.domain === 'IDEAS') {
        queryopts.columns = ['id','name','organization_id', 'owner_uid', 'owner_gid', 'title'];
    }

    let orgId;
    if (queryopts.organizationId) {
        orgId = queryopts.organizationId;
    } else {
        const rr = await getConnection().query("SELECT organization_id FROM users WHERE id = " + queryopts.userId);
        orgId = rr[0].organization_id;
    }

    const q = QueryBuilder.buildReadAllFromDomainQuery({userId: queryopts.userId,
        domain: queryopts.domain,
        action: queryopts.action,
        organizationId: orgId,
        columns: queryopts.columns,
        withRowPermissions: queryopts.withRowPermissions,
        checkOwnership: queryopts.checkOwnership
    });

    const r = await getConnection().query(q.query, q.params);
    // const expectedObj = JSON.parse(expected);
    // const expectedProps = Object.getOwnPropertyNames(expectedObj);
    // const actualProps = Object.getOwnPropertyNames(r);
    // for (var key in actualProps) {
    //     if (!(key in expectedProps)) {
    //         r[key] = undefined;
    //     }
    // }
    const sortedR = r.sort(compareIt).map(o => { return Object.assign({}, o)});
    const sortedE = JSON.parse(expected).sort(compareIt).map(o => {return Object.assign({}, o)});

    expect(sortedR).toEqual(sortedE);
}


export {
    check_read_all_query as checkReadAllQuery
}
