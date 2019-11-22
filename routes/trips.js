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
const UserService = require('../services/UserService');

router.get('/', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  try {
    let user = await UserService.findById(req.session.user_id);
    if(user == null || user.role == null) {
      throw "User or user role not defined";
    }

    if(user.role === 'admin') {
      const trips = await TripService.findAll();
      res.json({
        trips: trips
      });
      return;
    }

    if(user.role === 'third_party') {
      let company = await CompanyService.findByUserId(req.session.user_id);

      if(company == null) {
        throw "This user does not belong to any company";
      }

      const trips = await TripService.findByCompanyId(company.id);

      res.json({
        trips: trips
      });
      return;
    }
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.get('/:id', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  const tripId = parseInt(req.params.id);

  if(isNaN(tripId)) {
    res.status(500).json({err: "Invalid trip id"});
    return;
  }

  try {
    let user = await UserService.findById(req.session.user_id);

    if(user == null || user.role == null) {
      throw "User or user role not defined";
    }

    if(user.role === 'admin') {
      const trip = await TripService.findById(tripId);
      res.json({
        trip: trip
      });
      return;
    }

    if(user.role === 'third_party') {
      //blah
      return;
    }


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

router.put('/:id', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  const tripId = parseInt(req.params.id);
  const vehicleId = parseInt(req.body.vehicle_id);
  const hidden = req.body.hidden;
  const daysOfTheWeek = req.body.days_of_the_week;

  if(isNaN(tripId)) {
    res.status(500).json({err: 'Supplied vehicle id is not a number'});
    return;
  }

  if(isNaN(vehicleId)) {
    res.status(500).json({err: 'Supplied vehicle id is not a number'});
    return;
  }

  if(!Array.isArray(daysOfTheWeek)) {
    res.status(500).json({err: 'days of the week are not an array'});
    return;
  }

  if(typeof hidden !== 'boolean') {
    res.status(500).json({err: 'invalid hidden'});
    return;
  }

  try {
    const trip = await TripService.updateById(tripId, vehicleId, daysOfTheWeek, hidden);
    res.json({
      trip: trip
    });
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

module.exports = router;
