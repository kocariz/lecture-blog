var express = require('express');
const commentController = require('../controllers/commentController');
const { route } = require('.');
var router = express.Router();
  
//COMMENT ROUTES

//POST request for create comment
router.post('/create-comment/:id', commentController.create_comment_post);

//POST request for delete comment
router.post('/delete-comment/:id', commentController.delete_comment);

//GET request for comments update
router.get('/update-comment/:id', commentController.update_comment_get);

//POST request for comments update
router.post('/update-comment/:id', commentController.update_comment_post);
module.exports = router;