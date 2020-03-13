import {User} from './models/user'
import express from 'express'
import jwt from 'jsonwebtoken'
import {ConnectionPool, config} from 'mssql';
import assert from 'assert'


// TODO extract to own module/class Services/dbService
assert(process.env.DB_USER, "Database User not set")
assert(process.env.DB_PWD, "Database Password not set")
assert(process.env.DB_SERVER_URL, "Database Server URL not set")
assert(process.env.DB_NAME, "Database name not set")

const sqlConfig: config = {
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  server: process.env.DB_SERVER_URL as string,
  database: process.env.DB_NAME as string,
  options: {
    encrypt: true, // nessessary for connection with Azure
    enableArithAbort: true // Only set to silence deprecated warning
  }
};

let sql: ConnectionPool;

// Connect to Database
(async () => {
  try {
    sql = await new ConnectionPool(sqlConfig).connect()
  } catch (err) {
    console.log(err)
  }
})()

// ! Express
const app = express();

const users: User[] = [
  {
      username: 'john',
      password: 'password123admin',
      role: 'admin'
  }, {
      username: 'anna',
      password: 'password123member',
      role: 'member'
  }
];
const secret = "youshallpass"


app.use(express.json()) // Body-parser

// Middleware only for api calls
app.use('/api/*', (req,res, next) => {

  const authHeader = req.headers.authorization
  if (authHeader) {
    const token = authHeader.split(' ')[1] // remove the 'Bearer' from Header
    jwt.verify(token, secret, (err, payload) => {
      if(err) {
        return res.sendStatus(403)
      }
      req.user = payload as User
      next()
    })
  } else {
    res.sendStatus(401)
  }
  
})

app.get('/',  (req, res) => {
  res.send('Hello World from 🐳!');
});

app.post('/login', (req, res) => {
  let {username, password} = req.body
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    const tokenPayload = {
      username: user.username,
      role: user.role
    }
    const accessToken = jwt.sign(tokenPayload, secret)
    res.send({accessToken})
  } else {
    res.sendStatus(401)
  }
})

// TODO 
app.get("/items", async (req, res) => {
  res.send((await sql.request().query("Select * from Items")).recordset)
})

// TODO extract to api path
app.get('/api/treasure', (req,res) => {
  res.send(`💰 for ${req.user.username}`)
})

const port = process.env.PORT || 3000
const server = app.listen(port,  () =>  {
  console.log(`Project1 backend listening on port ${port}!`);
  console.log(`Environment variable test: ${process.env.TEST}`)
});


// Gracefull shutdown
process.on("SIGTERM", () => {
  console.log("Termination Signal received")
  new Promise((resolve, reject) => server.close(() => resolve()))
  .then(() => sql.close())
  .then(() => process.exit(0))
})
