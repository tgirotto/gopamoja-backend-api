const pg = require('../config/pg');
const Router = require('express-promise-router');

const StopService = require('../services/StopService');

const router = new Router()

router.get('/', async function(req, res, next) {
  try {
    const stops = await StopService.findAll();

    res.json({
      stops: stops
    })
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});

module.exports = router;
