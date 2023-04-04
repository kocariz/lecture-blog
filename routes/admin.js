var express = require('express');
const adminController = require('../controllers/adminController');
const { route } = require('.');
var router = express.Router();
  
//ADMIN ROUTES

//GET request for getting general user info
router.get('/info', adminController.admin_info);

//GET request for getting list of users posts list
router.get('/info/posts', adminController.admin_posts_info);

//GET request for getting list of users comments list
router.get('/info/comments', adminController.adminn_comment_info);

module.exports = router;