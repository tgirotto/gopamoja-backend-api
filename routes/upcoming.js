const pg = require('../config/pg');
const Router = require('express-promise-router');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const router = new Router()

const SCHEDULE_DAYS_INTO_THE_FUTURE = 3;

const RouteStopService = require('../services/RouteStopService');
const UpcomingService = require('../services/UpcomingService');
const ManagerService = require('../services/ManagerService');

router.get('/', async function(req, res, next) {
  let page = parseInt(req.query.page);
  let size = parseInt(req.query.size);

  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  try {
    if(isNaN(page)) {
      throw "page is invalid"
    }

    if(isNaN(size)) {
      throw "size is invalid"
    }

    let user = await ManagerService.findById(req.session.user_id);

    if(user == null || user['access_level'] == null) {
      throw "User or user role not defined";
    }

    let upcoming = [];
    if(user['access_level'] === 'admin') {
      upcoming = await UpcomingService.findByPageAndSizeAndDeleted(page, size, false);
    } else if(user['access_level'] === 'third_party') {
      let companies = await ManagerService.findCompaniesById(user['id']);

      if(companies == null || companies.length < 1) {
        throw "this user does not belong to any company"
      }

      let companyIds = companies.map((x) => {return x['id']});

      upcoming = await UpcomingService.findByCompanyIds(companyIds);
    } else {
      throw "User role not found"
    }

    res.json({
      upcoming: upcoming
    });
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});

module.exports = router;
