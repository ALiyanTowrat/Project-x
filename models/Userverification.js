const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserverificationSchema = new Schema ({
    userId:String,
    uniqueString:String,
    createdAt:Date,
    expiresAt:Date
})

const Userverification = mongoose.model('Userverification',UserverificationSchema)

module.exports= Userverification;