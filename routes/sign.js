var express = require('express');
const userController = require('../controllers/userController');
var router = express.Router();

//SIGN ROUTES

//GET request for sign in
router.get('/sign-in', userController.user_signin_get);

//POST request for sign in
router.post('/sign-in', userController.user_signin_post);

//GET request for sign up
router.get('/sign-up',  userController.user_signup_get);

//POST request for sign up
router.post('/sign-up', userController.user_signup_post);

//GET request for sign out
router.get('/sign-out', userController.user_signout);

module.exports = router;