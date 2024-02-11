import mongoose from "mongoose";
import validator from "validator";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
//User database models
const UserSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Provide name please'], minlength: 3, maxlength: 20, trim: true, },
    email: { type: String, required: [true, 'Provide email please'], validate: { validator: validator.isEmail, message: 'Please provide a valid email' }, unique: true, },
    password: { type: String, required: [true, 'Provide password please'], minlength: 6, select: false, },
    lastName: { type: String, trim: true, maxlength: 20, default: 'LastName', },
    location: { type: String, trim: true, maxlength: 20, default: 'my city', },
})
UserSchema.pre('save', async function () {
    //console.log(this.modifiedPaths())//only print the attribute that we are updating
    if (!this.isModified('password')) {
        return
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)


})
UserSchema.methods.createJWT = function () {
    return jwt.sign({ userID: this._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME }) // JWT_SECRET in .env 265bit key from any key generator website
}
UserSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch
}
export default mongoose.model('User', UserSchema)