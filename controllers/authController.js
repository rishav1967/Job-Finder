import User from '../models/User.js'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError, UnAuthenticatedError } from '../errors/index.js'

//use user.userId if using req.user.userId else user.userID
const register = async (req, res) => {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
        throw new BadRequestError('please provide all values')
    }
    const userAlreadyExists = await User.findOne({ email })
    if (userAlreadyExists) {
        throw new BadRequestError('Email already in use')
    }
    const user = await User.create({ name, email, password })
    const token = user.createJWT()
    res.status(StatusCodes.CREATED).json({ user: { email: user.email, lastName: user.lastName, location: user.location, name: user.name }, token, location: user.location }) //instead of StatusCodes.OK we can hard code error numbers like 201,All the mentioned fields will be shown in postman when we register a user

}
const login = async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        throw new BadRequestError("Please provide all values")
    }
    //.select('+password') is used because in our original user password model we have select:False i.e it was preventing the selection of password and we are overriding this here so we can get password from user instance
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
        throw new UnAuthenticatedError("Invalid Credentials")
    }
    //console.log(user)
    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect) {
        throw new UnAuthenticatedError("Invalid Credentials")
    }
    const token = user.createJWT()
    user.password = undefined//to not to send password as we already logged in and not need it ,so increase safety
    res.status(StatusCodes.OK).json({ user, token, location: user.location })
    //res.send('login user')
}
const updateUser = async (req, res) => {
    const { name, email, lastName, location } = req.body
    if (!email || !name || !lastName || !location) {
        throw new BadRequestError("Please provide all values")
    }
    const user = await User.findOne({ _id: req.user.userId })
    user.email = email
    user.name = name
    user.lastName = lastName
    user.location = location
    await user.save()
    const token = user.createJWT()
    res.status(StatusCodes.OK).json({ user, token, location: user.location })
    //user.save()
}
export { register, login, updateUser }