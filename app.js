require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const cors = require("cors");
var logger = require('morgan');
require('./database/db');
const adminRoutes = require('./routes/adminRoutes');
const equipmentRoutes =  require('./routes/equipmentRoutes');
const userRoutes = require('./routes/userRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes')
const requestLogger = require('./middleware/requestLogger');


var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(requestLogger);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/dashboard', dashboardRoutes);




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
