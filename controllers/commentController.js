const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const async = require("async");
const { body, validationResult } = require("express-validator");
const JsonWebToken = require("jsonwebtoken");
const comment = require("../models/comment");
const SECRET_JWT_CODE = "S4rf8tpPsNlxnQWpNFGU_-p-qKKLkyiY9GBeI5KAYHQ";

exports.create_comment_post = [
    // Validate and sanitize fields.
    body("comment")
      .trim(),
    // Process request after validation and sanitization.
    (req, res, next) => {
        if (req.cookies.user !== undefined) {
            // Extract the validation errors from a request.
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
                    let date_ob = new Date();
                    let date = ("0" + date_ob.getDate()).slice(-2);
                    // current month
                    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
                    // current year
                    let year = date_ob.getFullYear();
                    const comment = new Comment({
                        comment: req.body.comment,
                        author: results.user,
                        post: results.post,
                        publishDate: year + "-" + month + "-" + date,
                    });
                    comment.save((err) => {
                        if (err)
                            next(err);
                        async.parallel(
                            {
                                comment(callback) {
                                    Comment.find({post: req.params.id})
                                        .populate('author')
                                        .sort([["publishDate", "descending"]])
                                        .exec(callback);
                                }
                            },
                            (err, results_two, next) => {
                                res.render("post", {
                                    post: results.post,
                                    user: results.user,
                                    comment_list: results_two.comment,
                                });
                                return;
                            });
                    })
                }
            );
        } else {
            res.redirect('/');
            return;
        }
    },
];

exports.delete_comment = (req, res, next) => {
  Comment.findByIdAndRemove(req.params.id, (err) => {
    if (err)
      return next(err);
    res.redirect('/account/info/comments');
  });
};

exports.update_comment_get = (req, res) => {
  User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) {
    if (err) {
        return next(err);
    }
    async.parallel(
        {
            comment(callback) {
                  Comment.findById(req.params.id)
                  .exec(callback);
            },
        },
        (err, results) => {
          res.render("update_comment", {
            error: err,
            comment: results.comment,
            user: user,
          });
        }
    );
  })
}

exports.update_comment_post = [
  body("comment")
    .trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) {
      if (err) {
          return next(err);
      }
      async.parallel(
        {
          comment(callback) {
            comment.findById(req.params.id)
            .populate('author')
            .populate('post')
            .exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          let date_ob = new Date();
          let date = ("0" + date_ob.getDate()).slice(-2);
          // current month
          let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);           
          // current year
          let year = date_ob.getFullYear();

          const comment = new Comment({
            comment: req.body.comment,
            publishDate: year + "-" + month + "-" + date,
            author: results.comment.author,
            post: results.comment.post,
            _id: req.params.id, //This is required, or a new ID will be assigned!
          });

          if (!errors.isEmpty()) {
            res.render("update_comment", {
              error: err,
              comment: comment,
              user: user,
            });
            return;
          }
          Comment.findByIdAndUpdate(req.params.id, comment, {}, (err, comment) => {
            if (err) {
              return next(err);
            }
            // Successful: redirect to book detail page.
            res.redirect('/account/info/comments');
            return;
          });
    
        }
      );
      return;
    });
  },
]