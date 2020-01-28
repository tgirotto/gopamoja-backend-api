const pg = require('../config/pg');
const Router = require('express-promise-router');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const BookingService = require('../services/BookingService');

const router = new Router()

router.get('/', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  try {
    const bookings = await BookingService.findAll();
    res.json({
      bookings: bookings
    })
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});

module.exports = router;
