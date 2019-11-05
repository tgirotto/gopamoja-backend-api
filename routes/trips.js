const pg = require('../config/pg');
const Router = require('express-promise-router');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const router = new Router()

const SCHEDULE_DAYS_INTO_THE_FUTURE = 3;

const RouteStopService = require('../services/RouteStopService');
const TripService = require('../services/TripService');

router.get('/', async function(req, res, next) {
  try {
    const trips = await TripService.findByCompanyId(1);
    res.json({
      trips: trips
    });
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.get('/:id', async function(req, res, next) {
  const tripId = req.params.id;

  if(typeof tripId !== 'string') {
    res.status(500).json({err: "Invalid trip id"});
    return;
  }

  try {
    const trip = await TripService.findById(tripId);
    res.json({
      trip: trip
    });
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.post('/', async function(req, res, next) {
  const vehicleId = parseInt(req.body.vehicle_id);
  const routeId = parseInt(req.body.route_id);
  const daysOfTheWeek = req.body.days_of_the_week;

  if(isNaN(vehicleId)) {
    res.status(500).json({err: 'Supplied vehicle id is not a number'});
    return;
  }

  if(isNaN(routeId)) {
    res.status(500).json({err: 'Supplied route id is not a number'});
    return;
  }

  if(!Array.isArray(daysOfTheWeek)) {
    res.status(500).json({err: 'days of the week are not an array'});
    return;
  }

  try {
    const trip = await TripService.insertOne(vehicleId, routeId, daysOfTheWeek);
    res.json({
      trip: trip
    });
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

module.exports = router;
