const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema ({
    Email:String,
    password:String,
    contect:Number,
    Firstname:String,
    Lastname:String
})
const User = mongoose.model('User',UserSchema)
module.exports= User;