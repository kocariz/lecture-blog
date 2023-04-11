const User = require('../models/user');
const async = require('async');
const { body, validationResult } = require('express-validator');
const JsonWebToken = require('jsonwebtoken');
const Bcrypt = require('bcryptjs');
const SECRET_JWT_CODE = 'S4rf8tpPsNlxnQWpNFGU_-p-qKKLkyiY9GBeI5KAYHQ';

exports.user_signin_get = (req, res, next) => {
  if (req.cookies) {
    //check if there is cookie
    let authorization = req.cookies.user; //we get cookie from request
    let decode;
    try {
      decode = JsonWebToken.verify(authorization, SECRET_JWT_CODE); //check if cookie exists and get info given
    } catch (error) {
      res.render('sign-in'); //if no cookie just render sign-in without user info
      return;
    }
    let userId = decode.id; //get user id to  get it from db
    User.findById(userId)
      .then((user) => {
        res.render('home', {
          user: user,
        });
        return;
      })
      .catch((err) => {
        res.render('sign-in');
        return;
      });
  } else {
    res.render('sign-in');
    return;
  }
};

exports.user_signin_post = [
  // Validate and sanitize fields.
  body('email_singin')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Email must be specified.'),
  body('password_singin')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Password must be specified.'),
  // Process request after validation and sanitization.
  (req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render('sign-in', {
        user: req.body,
        errors: errors.array(),
      });
      return;
    }
    async.parallel(
      {
        user(callback) {
          User.findOne({ email: req.body.email_singin }).exec(callback);
        },
      },
      (err, results, next) => {
        if (err)
          return next(err);
        if (results.user == null) {
          // No user found so render sign up view
          res.render('sign-up');
          return;
        }
        if (!Bcrypt.compareSync(req.body.password_singin, results.user.password)) { //check if password is equal to the one saved on db using Bcrypt
          res.render('sign-in', { //if error on password rerender sign in page with error message
            user: req.body,
            errors: ['Wrong password'],
          });
        } else {
          //if password correct create user token using JWT and add it to user cookie
          const token = JsonWebToken.sign(
            { id: results.user._id, email: results.user.email },
            SECRET_JWT_CODE
          );
          res.cookie('user', token, { expire: 360000 + Date.now() }); //cookie expires after 360000 ms from the time it is set.
          // Successful, so redirect to home page
          res.redirect('/');
          return;
        }
      }
    );
  },
];

exports.user_signup_get = (req, res, next) => {
  if (req.cookies) {
    //check if there is cookie
    let authorization = req.cookies.user; //we get cookie from request
    let decode;
    try {
      decode = JsonWebToken.verify(authorization, SECRET_JWT_CODE); //check if cookie exists and get info given
    } catch (error) {
      res.render('sign-up'); //if no cookie just render sign-up without user info
      return;
    }
    let userId = decode.id; //get user id to  get it from db
    //get user, if so render home page
    User.findById(userId)
      .then((user) => {
        res.render('home', {
          user: user,
        });
        return;
      })
      .catch((err) => {
        res.render('sign-up');
        return;
      });
  } else {
    res.render('sign-up');
    return;
  }
};

exports.user_signup_post = [
  // Validate and sanitize fields.
  body('username')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Username must be specified.'),
  body('email')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Email must be specified.'),
  body('confirmEmail')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Confirm email must be specified.'),
  body('password')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Password must be specified.'),
  body('confirmPassword')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Confirm password must be specified.'),
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render('sign-up', {
        user: req.body,
        errors: errors.array(),
      });
      return;
    }
    if (req.body.email !== req.body.confirmEmail) { //check if both emails proportioned are the same.
      res.render('sign-up', {
        user: req.body,
        errors: ['email is not the same as the confirm one'],
      });
      return;
    }
    if (req.body.password !== req.body.confirmPassword) { //check if both passwords proportioned are the same
      res.render('sign-up', {
        user: req.body,
        errors: ['password is not the same as the confirm one'],
      });
      return;
    }

    //Create user with info received, and has password to store on db
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: Bcrypt.hashSync(req.body.password, 10),
    });
    user.save((err) => {
      //save new user on db
      if (err)
        next(err);
      //create and store new token of user in cookie
      const token = JsonWebToken.sign(
        { id: user._id, email: user.email },
        SECRET_JWT_CODE
      );
      res.cookie('user', token, { expire: 360000 + Date.now() }); //cookie expires after 360000 ms from the time it is set.
      // Successful, so redirect to home page
      res.redirect('/');
      return;
    });
  },
];

//Deletes  user cookie and displays home view
exports.user_signout = (req, res, next) => {
  res.clearCookie('user');
  res.redirect('/');
};
