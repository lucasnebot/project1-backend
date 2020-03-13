import { ConnectionPool, config, IResult, Request } from 'mssql';
import assert from 'assert'


const SQL_CONFIG: config = {
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    server: process.env.DB_SERVER_URL as string,
    database: process.env.DB_NAME as string,
    options: {
        encrypt: true, // nessessary for connection with Azure
        enableArithAbort: true // Only set to silence deprecated warning
    }
};

export class DBService {
    static instance: DBService;

    private sql = new ConnectionPool(SQL_CONFIG)

    constructor() {
        assert(process.env.DB_USER, "Database User not set")
        assert(process.env.DB_PWD, "Database Password not set")
        assert(process.env.DB_SERVER_URL, "Database Server URL not set")
        assert(process.env.DB_NAME, "Database name not set")

        if (DBService.instance) {
            return DBService.instance
        }
        DBService.instance = this
    }

    getItems() {
        return this.query("Select * from Items")
    }

    private query(query: string) {
        return this.sql.request().query(query)
    }

    connect() {
        return this.sql.connect()
    }


}