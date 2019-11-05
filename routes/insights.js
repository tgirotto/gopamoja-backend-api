const pg = require('../config/pg');
const Router = require('express-promise-router');

const InsightService = require('../services/InsightService');

const router = new Router()

router.get('/cities', async function(req, res, next) {
  try {
    const obj = await InsightService.findCities();
    res.json(obj);
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.get('/users', async function(req, res, next) {
  const topLeftLat = parseFloat(req.query.top_left_lat);
  const topLeftLon = parseFloat(req.query.top_left_lon);
  const bottomRightLat = parseFloat(req.query.bottom_right_lat);
  const bottomRightLon = parseFloat(req.query.bottom_right_lon);

  if(isNaN(topLeftLat)) {
    res.status(500).json({err: "Invalid top left lat"});
    return;
  }

  if(isNaN(topLeftLon)) {
    res.status(500).json({err: "Invalid top left lon"});
    return;
  }

  if(isNaN(bottomRightLat)) {
    res.status(500).json({err: "Invalid bottom right lat"});
    return;
  }

  if(isNaN(bottomRightLon)) {
    res.status(500).json({err: "Invalid bottom right lon"});
    return;
  }

  try {
    const obj = await InsightService.findUsers(topLeftLat, topLeftLon, bottomRightLat, bottomRightLon);
    res.json(obj);
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

module.exports = router;
