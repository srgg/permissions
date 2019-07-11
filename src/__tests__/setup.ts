import { getConnection, createConnection, getConnectionManager } from "typeorm";
import {Idea} from "../entity/idea";
import {User} from "../entity/user";

beforeAll(async () => {
    const connectionManager = getConnectionManager();

    const connection = await connectionManager.create({
        name: "default",
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
        synchronize: false,
    });

    await connection.connect();
    console.log('connected');
});

afterAll(async () => {
    // await getConnection().close();
});
