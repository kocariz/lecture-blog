var express = require('express');
const postController = require('../controllers/postController');
const { route } = require('.');
const multer  = require('multer');
var router = express.Router();

var storage = multer.diskStorage({
    destination: 'public/images/posts',
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + '.png')
    }
})

var upload = multer({storage: storage});

//POST ROUTES

//GET request for create post
router.get('/create-post', postController.create_post_get);

//POST request for create post
router.post('/create-post', upload.single('img_post'), postController.create_post_post);

//GET request for post detaails page
router.get('/:id', postController.post_detail);

//GET request for posts list
router.get('/', postController.posts_list);

//POST request for delete post
router.post('/delete-post/:id', postController.delete_post);

//GET request for yupdate post
router.get('/update-post/:id', postController.update_post_get);

//POST request for update post
router.post('/update-post/:id', upload.single('img_post'), postController.update_post_post);

module.exports = router;