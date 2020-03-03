import {User} from '../../app/models/user'
export {} 
declare global{
    namespace Express {
        interface Request {
            user: User
        }
    }
}