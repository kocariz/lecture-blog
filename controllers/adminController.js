const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const async = require("async");
const { body, validationResult } = require("express-validator");
const JsonWebToken = require("jsonwebtoken");
const comment = require("../models/comment");
const { use } = require("../routes");
const SECRET_JWT_CODE = "S4rf8tpPsNlxnQWpNFGU_-p-qKKLkyiY9GBeI5KAYHQ";

exports.admin_info = (req, res) => {
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) {
        if (err) {
            return next(err);
        }
        async.parallel(
            {
              comments_count(callback) {
                    Comment.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
              },
              post_count(callback) {
                    Post.countDocuments({}, callback);
              },
              users_count(callback) {
                User.countDocuments({}, callback);
              }
            },
            (err, results) => {
              res.render("admin", {
                error: err,
                data: results,
                user: user,
              });
            }
        );
    })
}

exports.admin_posts_info = (req, res) => {
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) {
        if (err) {
            return next(err);
        }
        async.parallel(
            {
              posts(callback) {
                    Post.find({}, callback);
              },
            },
            (err, results) => {
                //console.log(results.posts);
              res.render("posts-list", {
                error: err,
                post_list: results.posts,
                user: user,
              });
            }
        );
    })
}

exports.admin_comment_info = (req, res) => {
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) {
        if (err) {
            return next(err);
        }
        async.parallel(
            {
                comments(callback) {
                    Comment.find({})
                    .populate('post')
                    .exec(callback);
                },
            },
            (err, results) => {
                //console.log(results.posts);
              res.render("comments-list", {
                error: err,
                comment_list: results.comments,
                user: user,
              });
            }
        );
    })
}

exports.admin_users_info = (req, res) => {
  User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) {
    if (err) {
        return next(err);
    }
    async.parallel(
        {
            users(callback) {
                User.find({})
                .exec(callback);
            },
        },
        (err, results) => {
            //console.log(results.posts);
          res.render("user-list", {
            error: err,
            user_list: results.users,
            user: user,
          });
        }
    );
})
}

exports.admin_last_posts = (req, res) => {
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) {
        if (err) {
            return next(err);
        }
        let date_ob = new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
        // current month
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        // current year
        let year = date_ob.getFullYear();
        let today = year + "-" + month + "-" + date;
        date_ob.setDate(date_ob.getDate() - 1);
        date = ("0" + date_ob.getDate()).slice(-2);
        // current month
        month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        // current year
        year = date_ob.getFullYear();
        let yesterday = year + "-" + month + "-" + date;
        async.parallel(
            {
                posts(callback) {
                    Post.find({publishDate: [today, yesterday]}, callback);
                },
            },
            (err, results) => {
                //console.log(results.posts);
                res.render("posts-list", {
                    error: err,
                    post_list: results.posts,
                    user: user,
                });
            }
        );
    })
}