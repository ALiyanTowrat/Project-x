const express = require('express');
const router = express.Router();

//mongodb user model
const User = require('../models/user')


//mongodb user verification model
const UserVerification = require("../models/Userverification")

//email handler
const nodemailer = require("nodemailer");

//unique string
const { v4: uuidv4 } = require("uuid")

//env variables
require("dotenv").config();

// password handler

const bcrypt = require('bcrypt');

// path
const path =require('path');
const { error } = require('console');
// const UserOTPVerification = require('./../models/UserOTPVerification');


//NODEMELIER STUFF

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    }
})

// TESTING SUCCESS
transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Ready for message");
        console.log(success)
    }
})

// signup
router.post('/signup', (req, res) => {
    let {Email, password, Firstname,Lestname, contect } = req.body;
    Email = Email
    password = password
    Firstname = Firstname
    Lestname= Lestname
    contect =  contect

    if (Firstname == "" || Email == "" || password == "" || Lastname == "" ||  contect =="") {
        res.json({
            status: "FAILED",
            massage: "Empty input fields!s"
        })
    } else if (!/^[a-zA-Z]*$/.test(Firstname)) {
        res.json({
            status: "FAILED",
            massage: "Invalid name entered"
        })
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(Email)) {
        res.json({
            status: "FAILED",
            massage: "Invalid email entered"
        })
    } else if (password.length < 8) {
        res.json({
            status: "FAILED",
            massage: "password is to short!"
        })
    } else {
        //checking if user already exists
        User.find({ Email })
        .then(result => {
            if (result.length) {
                // A user already exists
                res.json({
                    status: "FAILED",
                    massage: "User with provided email already exists"
                })
            } else {
                //Try to create new user

                //password handling
                const saltRound = 10;
                bcrypt
                .hash(password, saltRound).then(hashedpassword => {
                    const newUser = new User({
                        Firstname,
                        email,
                        password: hashedpassword,
                        Lestname,
                        contect,
                        verified: false,
                    });
                    newUser
                    .save()
                    .then(result => {
                        //handle account verification
                        sendVerificationEmail(result, res);
                    })
                        .catch(err => {
                            res.json({
                                status: "FAILED",
                                massage: "An error occurred while saving user account!"
                            })
                        })
                })
                    .catch(err => {
                        res.json({
                            status: "FAILED",
                            massage: "An error occurred while handling password!"
                        })
               })
            }
        }).catch(err => {
            console.log(err);
            res.json({
                status: "FAILED",
                massage: "An error occurred while checking for existing user!"
            })
        })
    }
})

// sending verification email
const sendVerificationEmail = ({ _id, email }, res) => {
    //url to be used in the email
    const currentUrl = "http://localhost:3000/";

    const uniqueString = uuidv4() + _id;

    // mail options
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify Your Email",
        html: `<p>Verify your email address to complete the signup and login to your account.</p><p>This link <b>expires in 6 hours</b>.</p><p>Press 
        <a href=${ currentUrl +"user/verify/" +_id +"/" + uniqueString}>here</a>to proceed.</p>`
    };
    //hash the uniqueString
    const saltRounds = 10;
    bcrypt
    .hash(uniqueString,saltRounds)
    .then((hashedUniqueString)=>{
        //set values in userVerification collection
        const NewVerification = new Userverification({
            userId :_id,
            uniqueString:hashedUniqueString,
            createdAt :Date.now(),
            expiresAt:Date.now() +21600000
        });
        NewVerification
        .save()
        .then(()=>{
            transporter.sendMail(mailOptions)
            .then(()=>{
                //email send and verification record saved
                res.json({
                    status:"PENDING",
                    massage:"Verification send"
                })
            })
            .catch((error)=>{
                console.log(error);
                res.json({
                    status:"FAILED",
                    message:"Verification email failed"
                });
            })
        })
    })
        .catch(()=>{
            res.json({
                status:"FAILED",
                message:"An error occurred while hashing email data!"
            });
        })
 }
// verify email
router.get("/verify/:userId/:uniqueString",(req,res)=>{
    let {userId,uniqueString}=req.params;

    Userverification
    .find({userId})
    .then((result)=>{
        if(result.length > 0){
            //user verification record exists so we proceed
            const {expiresAt} =result[0];
            const hashedUniqueString =result[0].uniqueString;
            //checking has expired unique string
            if(expiresAt <Date.now()){
                //record has expired so we delete it
                Userverification
                .deleteOne({userId})
                .then( result =>{
                    User
                    .deleteOne()
                    .then(()=>{
                        let message = "link has expired. Please sign up again ";
                        res.redirect(`/user/verified/error=true&message=$"{massage}`)
                    })
                    .catch((error)=>{
                        console.log(error);
                        let message = "Clearing user with expired unique steing failed";
                        res.redirect(`/user/verified/error=true&message=$"{massage}`)
                    })
                })
                .catch((error)=>{
                    console.log(error);
                    let message = "An error occurred while clearing expired user verification record";
                    res.redirect(`/user/verified/error=true&message=$"{massage}`)
                })
            }else{
                //valid record exists so we validate the  user string
                // first compare the hashed unique string
                bcrypt
                .compare(uniqueString,hashedUniqueString)
                .then(result=> {
                    if(result){
                        //string mach

                        User
                        .updateOne({_id: userId} ,{verification:true})
                        .then(()=>{
                            Userverification
                            .deleteOne({userId})
                            .then(()=>{
                                res.sendFile(path.join(__dirname, "./../user/verified.html"));
                            })
                            .catch(error =>{
                                console.log(error)
                                let message = "An error occurred while finalizing successful verifiacation.";
                                res.redirect(`/user/verified/error=true&message=$"{massage}`)
                            })

                        })
                        .catch(error =>{
                            console.log(error)
                            let message = "An error occurred while updating user record to show verified.";
                            res.redirect(`/user/verified/error=true&message=$"{massage}`)
                        })
                    }else{
                        //existing record but incorrect verification details passed
                        let message = "Invalid varification details passed. Cheak your inbox.";
                        res.redirect(`/user/verified/error=true&message=$"{massage}`)
                    }
                })
                .catch(error =>{
                    let message = "An error occurred while compare unique strings.";
                    res.redirect(`/user/verified/error=true&message=$"{massage}`)
                })
            }
        }else{
            //user verification record doesn't exists 
            let message = "Account record doesn't exists or has been verified already. please sign up or log in.";
            res.redirect(`/user/verified/error=true&message=$"{massage}`)
        }
    })
    .catch((error) =>{
        console.log(error)
        let message = "An error occurred while checking for existing user verification record";
        res.redirect(`/user/verified/error=true&message=$"{massage}`)
    })
})

//Verified page router
router.get("verified",(req,res)=>{
    res.sendFile(path.json(__dirname),"./../user/verified.html")
})
//signin
router.post('/signin', (req, res) => {
    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();

    if (email == "" || password == "") {
        res.json({
            status: "FAILED",
            massage: "Empty credentials supplied"
        })
    } else {
        // check if user exist
        User.find({ email })
            .then(data => {
                if (data.length) {
                    //user exists

                    //check if user is verifiec
                    if(!data[0].verified){
                        res.json({
                            status: "FAILED",
                            massage: "Email hasn't been verified yet.check your inbox."
                        })
                    }else{ 
                        const hashedpassword = data[0].password;
                        bcrypt.compare(password, hashedpassword)
                        .then(result => {
                            if (result) {
                                // password match
                                res.json({
                                    status: 'SUCCESS',
                                    massage: 'signup successful',
                                    data: data,
                                })
                            } else {
                                res.json({
                                    status: "FAILED",
                                    massage: "Invalid password entered!"
                                })
                            }
                        })
                            .catch(err => {
                                res.json({
                                    status: "FAILED",
                                    massage: "An error occurred while comparing password!"
                                })
                            })}
                } else {
                    res.json({
                        status: "FAILED",
                        massage: "Invalid credentials entered!"
                    })
                }
            })
            .catch(err => {
                res.json({
                    status: "FAILED",
                    massage: "An error occurred while cheaking for existing user!"
                })
            })
    }
})
