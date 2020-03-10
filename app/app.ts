import {User} from './models/user'
import express from 'express'
import jwt from 'jsonwebtoken'

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


app.get('/api/treasure', (req,res) => {
  res.send(`💰 for ${req.user.username}`)
})

const port = process.env.PORT || 3000
app.listen(port,  () =>  {
  console.log(`Project1 backend listening on port ${port}!`);
  console.log(`Environment variable test: ${process.env.TEST}`)
});