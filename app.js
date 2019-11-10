var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var pg = require('./config/pg');
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);

var routesRouter = require('./routes/routes');
var tripsRouter = require('./routes/trips');
var journeysRouter = require('./routes/journeys');
var vehiclesRouter = require('./routes/vehicles');
var bookingsRouter = require('./routes/bookings');
var stopsRouter = require('./routes/stops');
var insightsRouter = require('./routes/insights');
var companiesRouter = require('./routes/companies');
var ticketRequestsRouter = require('./routes/ticket_requests');

var app = express();
app.use(cors({origin:['http://localhost:4200', 'https://admin.gopamoja.com', 'https://test.admin.gopamoja.com'], credentials: true}));
app.use(session({
  store: new pgSession({
    pool : pg,
    tableName : 'sessions'
  }),
  secret: "gopamoja!",
  resave: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, secure: false},
  saveUninitialized: false
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/routes', routesRouter);
app.use('/trips', tripsRouter);
app.use('/journeys', journeysRouter);
app.use('/bookings', bookingsRouter);
app.use('/vehicles', vehiclesRouter);
app.use('/stops', stopsRouter);
app.use('/insights', insightsRouter);
app.use('/companies', companiesRouter);
app.use('/ticket_requests', ticketRequestsRouter);

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
