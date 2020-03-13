import {User} from './models/user'
import express from 'express'
import jwt from 'jsonwebtoken'
import {IResult} from 'mssql';
import {DBService} from './services/dbService'
import assert from 'assert'

const dbService = new DBService()

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


assert(process.env.JWT_SECRET, "No JWT secret set")
const secret = process.env.JWT_SECRET as string

// Middleware
app.use(express.json()) // Body-parser

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


app.get("/items", async (req, res) => {
  let queryResult = await dbService.getItems().catch((err) => {
    console.log(err)
    res.sendStatus(500)
  }) as IResult<any>
  res.send(queryResult.recordset)
})

// TODO extract to api path
app.get('/api/treasure', (req,res) => {
  res.send(`💰 for ${req.user.username}`)
})

//! Connect to DB and start server
dbService.connect()
.then(() => {
  const port = process.env.PORT || 3000
  app.listen(port,  () =>  {
    console.log(`Project1 backend listening on port ${port}!`);
  });
})
.catch((err) => console.log(err))


// ?  Nessessary ?
/* // Gracefull shutdown
process.on("SIGTERM", () => {
  console.log("Termination Signal received")
  new Promise((resolve, reject) => server.close(() => resolve()))
  .then(() => sql.close())
  .then(() => process.exit(0))
})
 */