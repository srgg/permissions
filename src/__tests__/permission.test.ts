'use strict';

// https://houbb.github.io/2016/08/11/shiro
// https://stackoverflow.com/questions/20215744/how-to-create-a-mysql-hierarchical-recursive-query
// https://blog.morizyun.com/javascript/library-typescript-jest-unit-test.html

import {User} from "../entity/user";
import {Idea} from '../entity/idea';
import {QueryBuilder} from "../QueryBuilder";

const QueryTemplater = require('query-template');
const TypeOrm = require('typeorm');

test('read all allowed ideas', async () => {
    const connection = await TypeOrm.createConnection({
        type: "mysql",
        host: "localhost",
        port: 3306,
        username: "user",
        password: "user",
        database: "test",
        entities: [
            Idea,
            User
        ],
        synchronize: true,
    });

    {
        // -- first inventor should be able to read own ideas only
        const q1 = QueryBuilder.buildAllResourceQuery(1, 'IDEAS', 'READ', true, true);
        const r1 = await connection.manager.query(q1.query, q1.params);
        // console.log(r1);
        expect(r1.length).toEqual(2);


        // -- second inventor should be able to read his own ideas as well as an idea shared by the first inventor
        const q2 = QueryBuilder.buildAllResourceQuery(2, 'IDEAS', 'READ', true, true);
        const r2 = await connection.manager.query(q2.query, q2.params);
        expect(r2.length).toEqual(3);

        const q3 = QueryBuilder.buildAllResourceQuery(3, 'IDEAS', 'READ', true, true);
        const r3 = await connection.manager.query(q3.query, q3.params);
        expect(r3.length).toEqual(0);

        // -- manager should be able to read all the ideas of the entire organization
        const q4 = QueryBuilder.buildAllResourceQuery(4, 'IDEAS', 'READ', true, true);
        const r4 = await connection.manager.query(q4.query, q4.params);
        expect(r4.length).toEqual(4);
    }

    {
        // ----------- admin should be able to read all users of the entire organization
        const q1 = QueryBuilder.buildAllResourceQuery(9, 'users', 'READ', false, true);
        const r1 = await connection.manager.query(q1.query, q1.params);
        console.log(r1);
        expect(r1.length).toEqual(5);

        const q2 = QueryBuilder.buildAllResourceQuery(1, 'users', 'READ', false, true);
        const r2 = await connection.manager.query(q2.query, q2.params);
        console.log(r2);
        expect(r2.length).toEqual(0);
    }
});
