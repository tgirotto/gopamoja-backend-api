const pg = require('../config/pg');
const Router = require('express-promise-router');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const router = new Router()

const SCHEDULE_DAYS_INTO_THE_FUTURE = 3;

const RouteStopService = require('../services/RouteStopService');
const RouteService = require('../services/RouteService');
const InsightService = require('../services/InsightService');

router.get('/', async function(req, res, next) {
  try {
    let routeStops = await RouteStopService.findByCompanyIdAndDeleted(1, false);
    let routes = [];
    let route;

    for(let rs of routeStops) {
      route = routes.find(x => x.id === rs.route_id);

      if(route == null) {
        route = {
          id: rs.route_id,
          origin_name: rs.stop_name
        }

        routes.push(route);
      }

      route['destination_name'] = rs.stop_name;
    }

    res.json({
      routes: routes
    });
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.get('/:id', async function(req, res, next) {
  const routeId = parseInt(req.params.id);

  if(isNaN(routeId)) {
    res.status(500).json({err: 'Supplied route id is not a number'});
    return;
  }

  try {
    const route = await RouteService.findById(routeId);
    res.json({
      route: route
    })
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.post('/', async function(req, res, next) {
  const stops = req.body.stops;

  if(!Array.isArray(stops)) {
    res.status(500).json({err: 'Stops are not an array'});
    return;
  }

  try {
    const route = await RouteService.insertOne(1, stops);
    res.json({
      route: route
    })
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});

router.put('/:id/segments', async function(req, res, next) {
  const routeId = parseInt(req.params.id);
  const segments = req.body.segments;

  if(isNaN(routeId)) {
    res.status(500).json({err: "Invalid route id"});
    return;
  }

  if(!Array.isArray(segments)) {
    res.status(500).json({err: 'Segments are not an array'});
    return;
  }

  try {
    const route = await RouteService.updateSegmentsByRouteId(routeId, segments);
    res.json({
      route: route
    })
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});

module.exports = router;
