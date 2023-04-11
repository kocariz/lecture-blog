var express = require('express');
const accountController = require('../controllers/accountController');
const { route } = require('.');
var router = express.Router();
  
//ACCOUNT ROUTES

//GET request for getting general user info
router.get('/info', accountController.account_info);

//GET request for getting list of users posts list
router.get('/info/posts', accountController.accounts_posts_info);

//GET request for getting list of users comments list
router.get('/info/comments', accountController.accounts_comment_info);

module.exports = router;