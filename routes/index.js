var express = require('express');
const User = require("../models/user");
const Post = require("../models/post");
const { JsonWebTokenError } = require('jsonwebtoken');
var router = express.Router();
const JsonWebToken = require("jsonwebtoken")
const Bcrypt = require("bcryptjs");
const SECRET_JWT_CODE = "S4rf8tpPsNlxnQWpNFGU_-p-qKKLkyiY9GBeI5KAYHQ";

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

/* GET home page. */
router.get('/', function(req, res, next) {
  //get an array with a list of the last 12 months
  let months = [];
  let d = new Date();
  d.setDate(1);
  for (let i=0; i<=11; i++) {
    months.push(monthNames[d.getMonth()] + ' ' + d.getFullYear());
    d.setMonth(d.getMonth() - 1);
  };

  //get all posts and sort them by publishDate
  Post.find().sort([["publishDate", "descending"]]).then((posts) =>  {
    if (req.cookies) { //check if there is cookie
      let authorization = req.cookies.user; //we get cookie from request
      let decode
      try {
        decode = JsonWebToken.verify(authorization, SECRET_JWT_CODE) //check if cookie exists and get info given
      } catch (error) {
        res.render('home', {
          posts: posts.slice(0, 10),
          months: months,
        }) //if no cookie just render home without user info
        return;
      }
      let userId = decode.id //get user id to  get it from db
      //get user from token from cookie
      User.findById(userId).then((user) => {
        //render home view with info received
        res.render('home', {
          user: user,
          posts: posts.slice(0, 10),
          months: months,
        })
        return;
      }).catch((err) => {
        res.render('home', {
          posts: posts.slice(0, 10),
          months: months,
        })
        return;
      })
    } else {
      res.render('home', {
        posts: posts.slice(0, 10),
        months: months,
      })
      return;
    }
  }).catch((err) => {
    res.render('home')
    return;
  })
});

module.exports = router;
