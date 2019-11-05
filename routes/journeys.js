const pg = require('../config/pg');
const Router = require('express-promise-router');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const router = new Router()

const SegmentService = require('../services/SegmentService');

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
          origin_name: rs.stop_name,
          days_of_the_week: rs.days_of_the_week,
          weeks_of_the_month: rs.weeks_of_the_month,
          months_of_the_year: rs.months_of_the_year
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

module.exports = router;
