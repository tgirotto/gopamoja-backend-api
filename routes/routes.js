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
const CompanyService = require('../services/CompanyService');

router.get('/', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  try {
    let company = await CompanyService.findByUserId(req.session.user_id);

    if(company == null) {
      throw "This user does not belong to any company";
    }

    let routeStops = await RouteStopService.findByCompanyIdAndDeleted(company.id, false);
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
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  const routeId = parseInt(req.params.id);

  if(isNaN(routeId)) {
    res.status(500).json({err: 'Supplied route id is not a number'});
    return;
  }

  try {
    let company = await CompanyService.findByUserId(req.session.user_id);

    if(company == null) {
      throw "This user does not belong to any company";
    }

    const route = await RouteService.findById(routeId);

    if(route.company_id !== company.id) {
      throw "Forbidden access";
    }

    res.json({
      route: route
    })
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.post('/', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  const stops = req.body.stops;

  if(!Array.isArray(stops)) {
    res.status(500).json({err: 'Stops are not an array'});
    return;
  }

  try {
    let company = await CompanyService.findByUserId(req.session.user_id);

    if(company == null) {
      throw "This user does not belong to any company";
    }

    const route = await RouteService.insertOne(company.id, stops);
    res.json({
      route: route
    })
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});

router.put('/:id/segments', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

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
    let companyByRoute = await CompanyService.findByRouteId(req.session.user_id);

    if(companyByRoute == null) {
      throw "Company not found";
    }

    let companyByUser = await CompanyService.findByUserId(req.session.user_id);

    if(companyByUser == null) {
      throw "Company not found";
    }

    if(companyByUser.id !== companyByRoute.id) {
      throw "Invalid user/company";
    }

    const route = await RouteService.updateSegmentsByRouteId(routeId, segments);
    res.json({
      route: route
    })
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});

module.exports = router;
