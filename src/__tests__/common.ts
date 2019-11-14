import {getConnection} from "typeorm";
import {ParametrizedQuery, QueryBuilder} from "../QueryBuilder";


function compareIt(a,b): number {
    return (a.id > b.id) ? 1 : -11
}

interface IsPermittedQueryParamsTest {
    user: number | string;
    domain: string;
    action: string;
    organizationId?: number;
    instanceId?: number;
    checkOwnership?: boolean;
}

interface BuildAllResourceQueryParamsTest {
    user: number | string;
    domain: string;
    action: string;
    organizationId?: number | null;
    columns?: string[];
    checkOwnership?: boolean;
}

async function execute_query_and_check(q: ParametrizedQuery, expected: string) {
    // console.log("SQL query:", q.query);
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
    const quotedE =
        // quote unquoted field names
        expected.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ')
        // replace single quotes with a double ones
            .replace(/:\s*'([^']+)'/g, ': "$1"');

    const sortedE = JSON.parse(quotedE).sort(compareIt).map(o => {return Object.assign({}, o)});

    // console.log("\nThe following data was received:",sortedR, "\n\n");
    expect(sortedR).toEqual(sortedE);

}

async function retrieveUserIdIfNeeded(user: number|string): Promise<number> {
    let uid: number;
    if(typeof user == 'string'){
        const r = await getConnection().query("SELECT id FROM users WHERE name = '" + user + "'");
        uid = r[0].id;
    } else if (typeof user == 'number'){
        uid = user;
    } else {
        throw new Error('"user" has a wrong type, it must be either a number or a string');
    }

    return uid;
}

async function retrieveOrganizationIdIfNeeded(uid: number, organization?: number|null): Promise<number|null> {
    let orgId;
    if (organization === null) {
        orgId = null;
    } else if (organization) {
        orgId = organization;
    } else {
        const rr = await getConnection().query("SELECT organization_id FROM users WHERE id = " + uid);
        orgId = rr[0].organization_id;
    }
    return orgId;
}

async function check_read_all_query(queryopts: BuildAllResourceQueryParamsTest, expected: string) {
    if ( !queryopts.columns && queryopts.domain === 'IDEAS') {
        queryopts.columns = ['id','name','organization_id', 'owner_uid', 'owner_gid', 'title', 'permitted'];
    }

    const uid: number = await retrieveUserIdIfNeeded(queryopts.user);
    const oid: number | null = await retrieveOrganizationIdIfNeeded(uid, queryopts.organizationId);

    const q = QueryBuilder.buildReadAllFromDomainQuery({userId: uid,
        domain: queryopts.domain,
        action: queryopts.action,
        organizationId: oid,
        columns: queryopts.columns,
        checkOwnership: queryopts.checkOwnership
    });

    await execute_query_and_check(q, expected);
}

async function check_permitted_query(queryopts: IsPermittedQueryParamsTest, expected: string) {
    const uid: number = await retrieveUserIdIfNeeded(queryopts.user);
    const oid: number | null = await retrieveOrganizationIdIfNeeded(uid, queryopts.organizationId);

    const q = QueryBuilder.buildIsPermittedQuery({
        userId: uid,
        domain: queryopts.domain,
        action: queryopts.action,
        organizationId: oid,
        checkOwnership: queryopts.checkOwnership === undefined ?  false : queryopts.checkOwnership,
        instanceId: queryopts.instanceId
    });

    await execute_query_and_check(q, expected);
}

async function check_read_all_subquery(queryopts: BuildAllResourceQueryParamsTest, expected: string) {
    const uid: number = await retrieveUserIdIfNeeded(queryopts.user);
    const oid: number | null = await retrieveOrganizationIdIfNeeded(uid, queryopts.organizationId);

    const q = QueryBuilder.buildReadAllFromSubDomainQuery({userId: uid,
        domain: queryopts.domain,
        action: queryopts.action,
        organizationId: oid,
        columns: queryopts.columns,
        checkOwnership: queryopts.checkOwnership
    });

    await execute_query_and_check(q, expected);
}

export {
    check_read_all_query as checkReadAllQuery,
    check_read_all_subquery as checkReadAllSubQuery,
    check_permitted_query as checkIsPermittedQuery
}
