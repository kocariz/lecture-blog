const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const async = require("async");
const JsonWebToken = require("jsonwebtoken");
const SECRET_JWT_CODE = "S4rf8tpPsNlxnQWpNFGU_-p-qKKLkyiY9GBeI5KAYHQ";

exports.admin_info = (req, res) => {
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) { //get user by cookie token
        if (err)
            return next(err);
        async.parallel(
            {
              comments_count(callback) {
                    Comment.countDocuments({}, callback); //Get all comments saved o db
              },
              post_count(callback) {
                    Post.countDocuments({}, callback); //Get all posts saved on db
              },
              users_count(callback) {
                User.countDocuments({}, callback); //Get all users saved on db
              }
            },
            (err, results) => {
              res.render("admin", { //render admin view with info received
                error: err,
                data: results,
                user: user,
              });
            }
        );
    })
}

exports.admin_posts_info = (req, res) => {
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) { //get user by cookie token
        if (err)
            return next(err);
        async.parallel(
            {
              posts(callback) {
                    Post.find({}, callback); //Get all posts on db
              },
            },
            (err, results) => {
              res.render("posts-list", { //render posts list view with info received
                error: err,
                post_list: results.posts,
                user: user,
              });
            }
        );
    })
}

exports.admin_comment_info = (req, res) => {
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) { //get user by cookie token
        if (err)
            return next(err);
        async.parallel(
            {
                comments(callback) { //Get all comments from db
                    Comment.find({})
                    .populate('post')
                    .exec(callback);
                },
            },
            (err, results) => {
              res.render("comments-list", { //render comments list with info received
                error: err,
                comment_list: results.comments,
                user: user,
              });
            }
        );
    })
}

exports.admin_users_info = (req, res) => {
  User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) { //get user by cookie token
    if (err)
        return next(err);
    async.parallel(
        {
            users(callback) { //Get all users from db
                User.find({})
                .exec(callback);
            },
        },
        (err, results) => {
          res.render("user-list", { //render user list with info received
            error: err,
            user_list: results.users,
            user: user,
          });
        }
    );
})
}

exports.admin_last_posts = (req, res) => {
    User.findById(JsonWebToken.verify(req.cookies.user, SECRET_JWT_CODE).id).exec(function (err, user) { //get user by cookie token
        if (err)
            return next(err);
        let date_ob = new Date();
        //get today date
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let today = year + "-" + month + "-" + date;

        //get yesterday date
        date_ob.setDate(date_ob.getDate() - 1);
        date = ("0" + date_ob.getDate()).slice(-2);
        month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        year = date_ob.getFullYear();
        let yesterday = year + "-" + month + "-" + date;

        async.parallel(
            {
                posts(callback) {
                    Post.find({publishDate: [today, yesterday]}, callback); //get all posts which publishDate is either today or yesterda
                },
            },
            (err, results) => {
                res.render("posts-list", { //render posts list with info received
                    error: err,
                    post_list: results.posts,
                    user: user,
                });
            }
        );
    })
}