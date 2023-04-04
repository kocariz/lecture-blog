var express = require('express');
const User = require("../models/user");
const Post = require("../models/post");
const { JsonWebTokenError } = require('jsonwebtoken');
var router = express.Router();
const JsonWebToken = require("jsonwebtoken")
const Bcrypt = require("bcryptjs");
const SECRET_JWT_CODE = "S4rf8tpPsNlxnQWpNFGU_-p-qKKLkyiY9GBeI5KAYHQ";

/* GET home page. */
router.get('/', function(req, res, next) {
  Post.find().sort([["publishDate", "descending"]]).then((posts) =>  {
    if (req.cookies) { //check if there is cookie
      let authorization = req.cookies.user; //we get cookie from request
      let decode
      try {
        decode = JsonWebToken.verify(authorization, SECRET_JWT_CODE) //check if cookie exists and get info given
      } catch (error) {
        res.render('home', {
          posts: posts
        }) //if no cookie just render home without user info
        return;
      }
      let userId = decode.id //get user id to  get it from db
      User.findById(userId).then((user) => {
        res.render('home', {
          user: user,
          posts: posts.slice(0, 10),
        })
        return;
      }).catch((err) => {
        res.render('home', {
          posts: posts
        })
        return;
      })
    } else {
      res.render('home', {
        posts: posts
      })
      return;
    }
  }).catch((err) => {
    res.render('home')
    return;
  })
});

module.exports = router;
