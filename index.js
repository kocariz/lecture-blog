var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var signRouter = require('./routes/sign');
var postRouter = require('./routes/post');
var commentRouter = require('./routes/comment');
var accountRouer = require('./routes/account');
var adminRouter = require('./routes/admin');

var app = express();

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const mongoDB =
  'mongodb+srv://kocariz:MdydEvvoOkxsNhiT@cluster0.648dda9.mongodb.net/lecture_blog?retryWrites=true&w=majority';

main()
  .then(() => console.log('done'))
  .catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/sign', signRouter);
app.use('/post', postRouter);
app.use('/comment', commentRouter);
app.use('/account', accountRouer);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
