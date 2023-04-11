const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const async = require("async");
const { body, validationResult } = require("express-validator");
const JsonWebToken = require("jsonwebtoken");
const SECRET_JWT_CODE = "S4rf8tpPsNlxnQWpNFGU_-p-qKKLkyiY9GBeI5KAYHQ";
const { exec } = require('child_process');

const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

exports.posts_list = (req, res, next) => {
    //get all posts + sort them based on publishDate
  Post.find()
      .sort([["publishDate", "descending"]])
      .exec(function (err, list_posts) {
        if (err)
          return next(err);
        if (req.cookies) { //check if there is cookie

          let authorization = req.cookies.user; //we get cookie from request
          let decode
          try {
              decode = JsonWebToken.verify(authorization, SECRET_JWT_CODE) //check if cookie exists and get info given
          } catch (error) { //if no cookie just render home without user info
            res.render("posts_list", {
              posts_list: list_posts,
            });
            return;
          }
          let userId = decode.id //get user id to  get it from db
          User.findById(userId).then((user) => {
            //Successful, so render
            res.render("posts_list", {
              user: user,
              posts_list: list_posts,
            });
            return;
          }).catch((err) => {
            res.render("posts_list", {
              posts_list: list_posts,
            });
            return;
          })
        } else {
          res.render("posts_list", {
            posts_list: list_posts,
          });
          return;
        }
    });
}

exports.create_post_get = (req, res, next) => {
    if (req.cookies) { //check if there is cookie
        let authorization = req.cookies.user; //we get cookie from request
        let decode
        try {
          decode = JsonWebToken.verify(authorization, SECRET_JWT_CODE) //check if cookie exists and get info given
        } catch (error) {
          res.redirect('/sign/sign-in');
          res.render('sign-in') //if no cookie just render sign-in without user info
          return;
        }
        let userId = decode.id //get user id to  get it from db
        User.findById(userId).then((user) => {
          res.render('create-post', { //render post creation view
            user: user
          })
          return;
        }).catch((err) => {
          res.redirect('/sign/sign-in');
          return;
        })
      } else {
        res.redirect('/sign/sign-in');
        return;
      }
}

exports.create_post_post = [
    // Validate and sanitize fields.
    body("title")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Title must be specified."),
    body("subtitle")
      .trim(),
    body("img_title")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Image title must be specified."),
    body("main_text")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Main text must be specified."),
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
    
        if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/errors messages.
          res.render("create-post", {
            post: req.body,
            errors: errors.array(),
          });
          return;
        }
        async.parallel(
            {
              user(callback) {
                User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(callback); //get user info from cookie token
              },
            },
            (err, results, next) => {
                if (err)
                  return next(err);

                if (results.user == null) {
                  //If no user found redirect to /
                  res.redirect('/');
                  return;
                }
                //check if subtitle form has info or not
                let subtitle = req.body.subtitle ? req.body.subtitle : null;

                //get today date
                let date_ob = new Date();
                let date = ("0" + date_ob.getDate()).slice(-2);
                let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
                let year = date_ob.getFullYear();

                //edit img path
                let final_path = (req.file.path).slice(6);

                const post = new Post({ //create new post with info received from form
                    title: req.body.title,
                    subtitle: subtitle,
                    img: final_path,
                    imgTitle: req.body.img_title,
                    author: results.user,
                    mainText: req.body.main_text,
                    publishDate: year + "-" + month + "-" + date,
                });
                post.save((err) => {
                  if (err)
                    next(err);
                  res.redirect('/'); //when post saved redirect to home page
                  return;
                })
                }
        );
    },
];

exports.post_detail = (req, res, next) => {
    if(req.cookies.user !== undefined) { //check if user cookie is defined
        async.parallel(
            {
                user(callback) {
                    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(callback); //get user info from cookie user token
                },
                post(callback) { //get post id + populate author info
                    Post.findById(req.params.id)
                        .populate('author')
                        .exec(callback);
                },
                comment(callback) { //get comments related to post+ populate author info + sort based on publishDate
                    Comment.find({post: req.params.id})
                        .populate('author')
                        .sort([["publishDate", "descending"]])
                        .exec(callback);
                }
            },
            (err, results) => {
                if (err)
                    return next(err);
                if (results.post == null) {
                    // No post found
                    const err = new Error("Post not found");
                    err.status = 404;
                    return next(err);
                }
                res.render("post", { //render post view with info received
                    post: results.post,
                    user: results.user,
                    comment_list: results.comment,
                });
            }
        )
    } else {
        async.parallel(
            {
                post(callback) {
                    Post.findById(req.params.id)
                        .populate('author')
                        .exec(callback);
                },
                comment(callback) {
                    Comment.find({post: req.params.id})
                        .populate('author')
                        .sort([["publishDate", "descending"]])
                        .exec(callback);
                }
            },
            (err, results) => {
                //console.log(req.params.id);
                if (err) {
                    return next(err);
                }
                if (results.post == null) {
                    // No results.
                    const err = new Error("Post not found");
                    err.status = 404;
                    return next(err);
                }
                // Successful, so render.
                //console.log(results.post);
                res.render("post", {
                    post: results.post,
                    user: undefined,
                    comment_list: results.comment,
                });
            }
        )
    }
}

exports.delete_post = (req, res, next) => {
  async.parallel(
    {
      post(callback) { //get post by id
        Post.findById(req.params.id).exec(callback);
      },
      comments(callback) { //get comments related to actual post + populate athor info
        Comment.find({ post: req.params.id })
        .populate('author')
        .exec(callback);
      }
    },
    (err, results) => {
      if (err)
        return next(err);
      results.comments.forEach(function(comment, index, arr) {
        Comment.findByIdAndRemove(comment._id, (err) => { //get all comments related to post and delete them
          if (err)
            return next(err);
        })
      })
        Post.findByIdAndRemove(req.params.id, (err) => { //get post and remove it + redirect to info posts page
            if (err)
                return next(err);
            res.redirect('/account/info/posts');
        })
      /*fs.unlink(results.post.img, (err) => {
        if (err) throw err;
        //console.log(results.post.img);
        Post.findByIdAndRemove(req.params.id, (err) => {
          if (err)
            return next(err);
          res.redirect('/account/info/posts');
        })
      });*/
    }
  );
};

exports.update_post_get = (req, res) => {
  User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) { //get user info from cookie token
    if (err)
        return next(err);
    async.parallel(
        {
            post(callback) { //get post info from id
              Post.findById(req.params.id)
              .exec(callback);
            },
        },
        (err, results) => {
          res.render("update-post", { //render update post view with info received from post
            error: err,
            post: results.post,
            user: user,
          });
        }
    );
  })
}

exports.update_post_post = [
    //get info from form anf sanitize
  body("title")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Title must be specified."),
  body("subtitle")
    .trim(),
  body("img_title")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Image title must be specified."),
  body("main_text")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Main text must be specified."),
  (req, res, next) => {
    const errors = validationResult(req);
    
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) { //get user info from cookie token
      if (err)
          return next(err);
      async.parallel(
        {
          post(callback) { //get post info from id + populate author info
            Post.findById(req.params.id)
            .populate('author')
            .exec(callback);
          }
        },
        (err, results) => {
          if (err)
            return next(err);

          //check if subtitle form is empty or not
          let subtitle = req.body.subtitle ? req.body.subtitle : null;

          //get today date
          let date_ob = new Date();
          let date = ("0" + date_ob.getDate()).slice(-2);
          let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
          let year = date_ob.getFullYear();

          //edit path to img
          let final_path = results.post.img;
          if (req.file !== undefined)
            final_path = (req.file.path).slice(6);
          
          const post = new Post({ //create new post with new and old info
            title: req.body.title,
            publishDate: year + "-" + month + "-" + date,
            author: results.post.author,
            subtitle: subtitle,
            mainText: req.body.main_text,
            img: final_path,
            imgTitle: req.body.img_title,
            _id: req.params.id, //This is required, or a new ID will be assigned!
          });

          if (!errors.isEmpty()) { //if there is any error rerednder update post view with info
            res.render("update-post", {
              error: err,
              post: post,
              user: user,
            });
            return;
          }
          Post.findByIdAndUpdate(req.params.id, post, {}, (err, post) => { //search for post on db and update it with new post created
            if (err)
              return next(err);
            res.redirect('/account/info/posts'); //redirect to posts info page
            return;
          });
    
        }
      );
      return;
    });
  },
]

exports.posts_list_month = (req, res) => {
    //set up month date
    let d = new Date(req.params.month);

    //get last 12 months list
    let months = [];
    let a = new Date();
    a.setDate(1);
    for (let i=0; i<=11; i++) {
        months.push(monthNames[a.getMonth()] + ' ' + a.getFullYear());
        a.setMonth(a.getMonth() - 1);
    };
    Post.find() //search all posts + sort them by publishDate
        .sort([["publishDate", "descending"]])
        .exec(function (err, list_posts) {
            //save just the posts that where published on the current month that is being searched
            let month = [];
            for (let i = 0; i < list_posts.length; i++) {
                let t = new Date(list_posts[i].publishDate)
                if (t.getMonth() === d.getMonth())
                    month.push(list_posts[i]);
            }
            if (err)
                return next(err);
            if (req.cookies) { //check if there is cookie
                let authorization = req.cookies.user; //we get cookie from request
                let decode
                try {
                    decode = JsonWebToken.verify(authorization, SECRET_JWT_CODE) //check if cookie exists and get info given
                } catch (error) {
                    res.render('home', {
                        months: months,
                        posts: month,
                    }); //if no cookie just render home without user info
                    return;
                }
                let userId = decode.id //get user id to  get it from db
                User.findById(userId).then((user) => {
                    //Successful, so render home page with posts + user + months info
                    res.render('home', {
                        user: user,
                        posts: month,
                        months: months,
                    })
                    return;
                }).catch((err) => {
                    res.render('home', {
                        months: months,
                        posts: month,
                    });
                    return;
                })
            } else {
                res.render('home', {
                    months: months,
                    posts: month,
                });
                return;
            }
        });
}