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
    (req, res, next) => {
        if (req.cookies.user !== undefined) { //check if user cookies is defined
            async.parallel(
                {
                    user(callback) {
                        User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(callback); //get user from cookie token
                    },
                    post(callback) { //get specific post + populate authors info
                        Post.findById(req.params.id)
                            .populate('author')
                            .exec(callback);
                    },
                },
                (err, results, next) => {
                    if (err)
                        return next(err);
                    if (results.user == null) {
                        // If there is no user logged in redirect to main page
                        res.redirect('/');
                        return;
                    }

                    //get today date
                    let date_ob = new Date();
                    let date = ("0" + date_ob.getDate()).slice(-2);
                    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
                    let year = date_ob.getFullYear();

                    //create new comment with info received from db and form
                    const comment = new Comment({
                        comment: req.body.comment,
                        author: results.user,
                        post: results.post,
                        publishDate: year + "-" + month + "-" + date,
                    });
                    comment.save((err) => { //save new comment created to  db
                        if (err)
                            next(err);
                        async.parallel(
                            {
                                comment(callback) { //get all posts related to current  post + populate author info + sort comments by publishDate
                                    Comment.find({post: req.params.id})
                                        .populate('author')
                                        .sort([["publishDate", "descending"]])
                                        .exec(callback);
                                }
                            },
                            (err, results_two, next) => {
                                res.render("post", { //render post view with info received
                                    post: results.post,
                                    user: results.user,
                                    comment_list: results_two.comment,
                                });
                                return;
                            });
                    })
                }
            );
        } else { //if user cookie is not defined
            res.redirect('/');
            return;
        }
    },
];

exports.delete_comment = (req, res, next) => {
  Comment.findByIdAndRemove(req.params.id, (err) => { //search comment by id and remove it
    if (err)
      return next(err);
    res.redirect('/account/info/comments'); //redirect to accounts info comments page
  });
};

exports.update_comment_get = (req, res) => {
  User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) { //get user from cookie token
    if (err)
        return next(err);
    async.parallel(
        {
            comment(callback) { //get comment by id
                  Comment.findById(req.params.id)
                  .exec(callback);
            },
        },
        (err, results) => {
          res.render("update_comment", { //render update comment view with actual comment to update info
            error: err,
            comment: results.comment,
            user: user,
          });
        }
    );
  })
}

exports.update_comment_post = [
    //get form data and sanitize
  body("comment")
    .trim(),
  (req, res, next) => {
    const errors = validationResult(req); //validate data from req
    
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) { //get user from cookie token
      if (err)
          return next(err);
      async.parallel(
        {
          comment(callback) {  //get comment info by id + populate authors info + populate posts info
            comment.findById(req.params.id)
            .populate('author')
            .populate('post')
            .exec(callback);
          }
        },
        (err, results) => {
          if (err)
            return next(err);

          //get today date
          let date_ob = new Date();
          let date = ("0" + date_ob.getDate()).slice(-2);
          let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
          let year = date_ob.getFullYear();

          const comment = new Comment({  //create new comment with new info from comment, and old one
            comment: req.body.comment,
            publishDate: year + "-" + month + "-" + date,
            author: results.comment.author,
            post: results.comment.post,
            _id: req.params.id, //This is required, or a new ID will be assigned!
          });

          if (!errors.isEmpty()) { //if there is an error rerender update comment view with info
            res.render("update_comment", {
              error: err,
              comment: comment,
              user: user,
            });
            return;
          }
          Comment.findByIdAndUpdate(req.params.id, comment, {}, (err, comment) => { //else find id and update by giving new one created
            if (err)
              return next(err);
            // Successful: redirect to comments page
            res.redirect('/account/info/comments');
            return;
          });
    
        }
      );
      return;
    });
  },
]