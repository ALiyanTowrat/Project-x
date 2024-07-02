require('dotenv').config();

const mongoose = require("mongoose")

mongoose.connect(process.env.MONGOBD_URL, {useNewUrlParser: true, useUnifiedTopology:true,})
.then(()=>{
    console.log("DB CONNECTED");
})
.catch((err)=> console.log(err));