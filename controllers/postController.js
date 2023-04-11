const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const async = require("async");
const { body, validationResult } = require("express-validator");
const JsonWebToken = require("jsonwebtoken");
const comment = require("../models/comment");
const SECRET_JWT_CODE = "S4rf8tpPsNlxnQWpNFGU_-p-qKKLkyiY9GBeI5KAYHQ";
const fs = require("fs");
const { exec } = require('child_process');

exports.posts_list = (req, res, next) => {
  Post.find()
      .sort([["publishDate", "descending"]])
      .exec(function (err, list_posts) {
        if (err) {
          return next(err);
        }
        if (req.cookies) { //check if there is cookie
          let authorization = req.cookies.user; //we get cookie from request
          let decode
          try {
            decode = JsonWebToken.verify(authorization, SECRET_JWT_CODE) //check if cookie exists and get info given
          } catch (error) {
            //Successful, so render
            res.render("posts_list", {
              posts_list: list_posts,
            }); //if no cookie just render home without user info
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
          res.render('create-post', {
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
    // Process request after validation and sanitization.
    (req, res, next) => {
        //console.log(req.file);
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
                User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(callback);
              },
            },
            (err, results, next) => {
                if (err) {
                  // Error in API usage.
                  return next(err);
                }
                if (results.user == null) {
                  // No results.
                  res.redirect('/');
                  return;
                }
                let subtitle = req.body.subtitle ? req.body.subtitle : null;
                let date_ob = new Date();
                let date = ("0" + date_ob.getDate()).slice(-2);
                // current month
                let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);           
                // current year
                let year = date_ob.getFullYear();
                let final_path = (req.file.path).slice(6);
                const post = new Post({
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
                    exec('git add public/', (err, stdout, stderr) => {
                        if (err) {
                            //some err occurred
                            console.error(err)
                        } else {
                            // the *entire* stdout and stderr (buffered)
                            //console.log(`stdout: ${stdout}`);
                            //console.log(`stderr: ${stderr}`);
                        }
                    });
                    exec('git commit -m "new file"', (err, stdout, stderr) => {
                        if (err) {
                            //some err occurred
                            console.error(err)
                        } else {
                            // the *entire* stdout and stderr (buffered)
                            //console.log(`stdout: ${stdout}`);
                            //console.log(`stderr: ${stderr}`);
                        }
                    });
                    exec('git push origin main', (err, stdout, stderr) => {
                        if (err) {
                            //some err occurred
                            console.error(err)
                        } else {
                            // the *entire* stdout and stderr (buffered)
                            //console.log(`stdout: ${stdout}`);
                            //console.log(`stderr: ${stderr}`);
                        }
                    });
                  res.redirect('/sign/sign-in');
                  return;
                })
                }
        );
    },
];

exports.post_detail = (req, res, next) => {
    if(req.cookies.user !== undefined) {
        async.parallel(
            {
                user(callback) {
                    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(callback);
                },
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
      post(callback) {
        Post.findById(req.params.id).exec(callback);
      },
      comments(callback) {
        Comment.find({ post: req.params.id })
        .populate('author')
        .exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // Success
      results.comments.forEach(function(comment, index, arr) {
        Comment.findByIdAndRemove(comment._id, (err) => {
          if (err)
            return next(err);
        })
      })
      fs.unlink(results.post.img, (err) => {
        if (err) throw err;
        //console.log(results.post.img);
        Post.findByIdAndRemove(req.params.id, (err) => {
          if (err)
            return next(err);
          res.redirect('/account/info/posts');
        })
      });
    }
  );
};

exports.update_post_get = (req, res) => {
  User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) {
    if (err) {
        return next(err);
    }
    async.parallel(
        {
            post(callback) {
              Post.findById(req.params.id)
              .exec(callback);
            },
        },
        (err, results) => {
          res.render("update-post", {
            error: err,
            post: results.post,
            user: user,
          });
        }
    );
  })
}

exports.update_post_post = [
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
    
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) {
      if (err) {
          return next(err);
      }
      async.parallel(
        {
          post(callback) {
            Post.findById(req.params.id)
            .populate('author')
            .exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          let subtitle = req.body.subtitle ? req.body.subtitle : null;
          let date_ob = new Date();
          let date = ("0" + date_ob.getDate()).slice(-2);
          // current month
          let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);           
          // current year
          let year = date_ob.getFullYear();

          let final_path = results.post.img;

          if (req.file !== undefined)
            final_path = (req.file.path).slice(6);
          
          const post = new Post({
            title: req.body.title,
            publishDate: year + "-" + month + "-" + date,
            author: results.post.author,
            subtitle: subtitle,
            mainText: req.body.main_text,
            img: final_path,
            imgTitle: req.body.img_title,
            _id: req.params.id, //This is required, or a new ID will be assigned!
          });

          if (!errors.isEmpty()) {
            res.render("update-post", {
              error: err,
              post: post,
              user: user,
            });
            return;
          }
          Post.findByIdAndUpdate(req.params.id, post, {}, (err, post) => {
            if (err) {
              return next(err);
            }
            // Successful: redirect to book detail page.
            res.redirect('/account/info/posts');
            return;
          });
    
        }
      );
      return;
    });
  },
]