import {getConnectionManager} from "typeorm";
// import {UserIdea} from "../entity/UserIdea.entity";
// import {User} from "../entity/User.entity";

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
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // entities: [
        //     UserIdea,
        //     User
        // ],
        synchronize: false,
    });

    await connection.connect();
    console.log('connected');
});

afterAll(async () => {
    const connectionManager = getConnectionManager();
    await connectionManager.get("default").close();
});
