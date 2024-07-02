var a =require('./config/DB')  


const app = require('express')();
const port =process.env.PORT|| 3000;

// cors
const cors = require("cors")
app.use(cors());

const appRouter = require('./api/app');
const { Router } = require('express');


// For accepting POST data
const body = require('body-parser').json;
app.use(body())

app.use('/app', appRouter)

Router.listen(port, () => {
    console.log(`Server running on port ${port}`);
});