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
    query_extension?: string;
    extended_params?: object;
}

interface BuildPermissionListQueryParamsTest {
    user: number | string;
    organizationId?: number;
    columns?: string[];
    query_extension?: string;
    extended_params?: object;
}

interface BuildAccessListForResourceQueryParamsTest {
    organizationId?: number;
    resource: string;
    action: string;
    resourceId: number;
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

async function retrieveOrganizationIdByResourceIfNeeded(resource: string, rid: number, organization?: number | null): Promise<number | null> {
    let orgId;
    if (organization === null) {
        orgId = null;
    } else if (organization) {
        orgId = organization;
    } else {
        const rr = await getConnection().query(`SELECT organizationId FROM \`${resource.toLowerCase()}\` WHERE id = ${rid}`);
        orgId = rr[0].organizationId;

        if (orgId === 1) {
            throw new Error('Organization Id can not be determined automatically, therefore it must be provided manually');
        }
    }
    return orgId;
}

async function retrieveOrganizationIdIfNeeded(uid: number, organization?: number | null): Promise<number | null> {
    return retrieveOrganizationIdByResourceIfNeeded('users', uid, organization);
}

async function check_read_all_primequery(queryopts: BuildAllResourceQueryParamsTest, expected: string) {
    if (!queryopts.columns && queryopts.domain === 'USER_IDEA') {
        queryopts.columns = ['id', 'name', 'organizationId', 'ownerUserId', 'ownerGroupId', 'title', 'permitted'];
    }

    const uid: number = await retrieveUserIdIfNeeded(queryopts.user);
    const oid: number | null = await retrieveOrganizationIdIfNeeded(uid, queryopts.organizationId);

    const q = QueryBuilder.buildReadAllFromPrimaryDomainQuery({
        userId: uid,
        resource: queryopts.domain,
        action: queryopts.action,
        organizationId: oid,
        columns: queryopts.columns,
        checkOwnership: queryopts.checkOwnership,
        queryExtension: queryopts.query_extension,
        extendedParams: queryopts.extended_params
    });

    await execute_query_and_check(q.parametrized, expected);
}

async function check_permitted_query(queryopts: IsPermittedQueryParamsTest, expected: string) {
    const uid: number = await retrieveUserIdIfNeeded(queryopts.user);
    const oid: number | null = await retrieveOrganizationIdIfNeeded(uid, queryopts.organizationId);

    const q = QueryBuilder.buildIsPermittedQuery({
        userId: uid,
        resource: queryopts.domain,
        action: queryopts.action,
        organizationId: oid,
        checkOwnership: queryopts.checkOwnership === undefined ? false : queryopts.checkOwnership,
        instanceId: queryopts.instanceId
    });

    await execute_query_and_check(q.parametrized, expected);
}

async function check_read_all_subquery(queryopts: BuildAllResourceQueryParamsTest, expected: string) {
    const uid: number = await retrieveUserIdIfNeeded(queryopts.user);
    const oid: number | null = await retrieveOrganizationIdIfNeeded(uid, queryopts.organizationId);

    const q = QueryBuilder.buildReadAllFromSubDomainQuery({
        userId: uid,
        resource: queryopts.domain,
        action: queryopts.action,
        organizationId: oid,
        columns: queryopts.columns,
        checkOwnership: queryopts.checkOwnership,
        queryExtension: queryopts.query_extension,
        extendedParams: queryopts.extended_params
    });

    await execute_query_and_check(q.parametrized, expected);
}

async function check_permission_list_query(queryopts: BuildPermissionListQueryParamsTest, expected: string) {
    const uid: number = await retrieveUserIdIfNeeded(queryopts.user);
    const oid: number | null = await retrieveOrganizationIdIfNeeded(uid, queryopts.organizationId);

    const q = QueryBuilder.buildPermissionListQuery({
        userId: uid,
        organizationId: oid,
        columns: queryopts.columns,
        queryExtension: queryopts.query_extension,
        extendedParams: queryopts.extended_params
    });

    await execute_query_and_check(q.parametrized, expected);
}

async function check_access_list_query(queryopts: BuildAccessListForResourceQueryParamsTest, expected: string) {
    const oid: number | null = await retrieveOrganizationIdByResourceIfNeeded(
        queryopts.resource,
        queryopts.resourceId,
        queryopts.organizationId
    );

    const q = QueryBuilder.buildAccessListForResourceQuery({
        organizationId: oid,
        resource: queryopts.resource,
        action: queryopts.action,
        resourceId: queryopts.resourceId,
        columns: queryopts.columns,
        checkOwnership: queryopts.checkOwnership
    });
    await execute_query_and_check(q.parametrized, expected);
}

export {
    check_read_all_primequery as checkReadAllQuery,
    check_read_all_subquery as checkReadAllSubQuery,
    check_permitted_query as checkIsPermittedQuery,
    check_permission_list_query as checkPermissionListQuery,
    check_access_list_query as checkAccessListQuery
}
