var express = require('express');
const adminController = require('../controllers/adminController');
const { route } = require('.');
var router = express.Router();
  
//ADMIN ROUTES

//GET request for getting general user info
router.get('/info', adminController.admin_info);

//GET request for getting list of posts
router.get('/info/posts', adminController.admin_posts_info);

//GET request for getting list of comments
router.get('/info/comments', adminController.admin_comment_info);

//GET request for getting list of users
router.get('/info/users', adminController.admin_users_info);

//GET request for getting list of last 24 hours posts
router.get('/info/latests-posts', adminController.admin_last_posts);

module.exports = router;