const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const async = require("async");
const JsonWebToken = require("jsonwebtoken");
const SECRET_JWT_CODE = "S4rf8tpPsNlxnQWpNFGU_-p-qKKLkyiY9GBeI5KAYHQ";

exports.account_info = (req, res) => {
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) { //get user by cookie token
        if (err)
            return next(err);
        async.parallel(
            {
              comments_count(callback) {
                    Comment.countDocuments({ author: user}, callback); //get all comments for matching user
              },
              post_count(callback) {
                    Post.countDocuments({ author: user }, callback); //get all posts for matching user
              },
            },
            (err, results) => { //render account view with received info
              res.render("account", {
                error: err,
                data: results,
                user: user,
              });
            }
        );
    })
}

exports.accounts_posts_info = (req, res) => {
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) { //get user by cookie token
        if (err)
            return next(err);
        async.parallel(
            {
              posts(callback) {
                    Post.find({ author: user }, callback); //get all posts for matching user
              },
            },
            (err, results) => {
              res.render("account_posts", { //send information to account posts views
                error: err,
                post_list: results.posts,
                user: user,
              });
            }
        );
    })
}

exports.accounts_comment_info = (req, res) => {
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) { //get user by cookie token
        if (err)
            return next(err);
        async.parallel(
            {
                comments(callback) { //get all comments with matching user + populate the post to get more info of the comments post
                      Comment.find({ author: user })
                      .populate('post')
                      .exec(callback);
                },
            },
            (err, results) => {
              res.render("account_comments", { //render account comments view with info received
                error: err,
                comment_list: results.comments,
                user: user,
              });
            }
        );
    })
}