const pg = require('../config/pg');
const Router = require('express-promise-router');

const StopService = require('../services/StopService');
const UserService = require('../services/UserService');

const router = new Router()

router.get('/', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  try {
    const stops = await StopService.findAll();
    res.json({
      stops: stops
    })
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});

router.get('/:id', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  try {
    const stopId = parseInt(req.params.id)

    if(isNaN(stopId)) {
      throw "Stop id invalid"
    }

    const stop = await StopService.findById(stopId);
    res.json({
      stop: stop
    })
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});

router.post('/', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  const name = req.body.name;
  const popular = req.body.popular;
  const country = req.body.country;
  const timezone = req.body.timezone;

  try {
    if(typeof name !== 'string') {
      throw "name is invalid"
    }

    if(typeof country !== 'string') {
      throw "country is invalid"
    }

    if(typeof timezone !== 'string') {
      throw "timezone is invalid"
    }

    if(typeof popular !== 'boolean') {
      throw "popular is invalid"
    }

    let user = await UserService.findById(req.session.user_id);

    if(user == null || user.role == null) {
      throw "User or user role not defined";
    }

    if(user.role === 'admin') {
      const stop = await StopService.insertOne(name, popular, country, timezone);
      res.json({
        stop: stop
      })
    } else {
      res.status(401).json({response: 'Not Authorised.'});
      return;
    }
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});

router.put('/:id', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  try {
    const stopId = parseInt(req.params.id);
    const name = req.body.name;
    const country = req.body.country;
    const timezone = req.body.timezone;
    const popular = req.body.popular;

    if(isNaN(stopId)) {
      throw 'Stop id is invalid'
    }

    if(typeof name !== 'string') {
      throw 'Name is invalid'
    }

    if(typeof country !== 'string') {
      throw 'country is invalid'
    }

    if(typeof timezone !== 'string') {
      throw 'timezone is invalid'
    }

    if(typeof popular !== 'boolean') {
      throw 'popular is invalid'
    }

    let user = await UserService.findById(req.session.user_id);

    if(user == null || user.role == null) {
      throw "User or user role not defined";
    }

    if(user.role === 'admin') {
      const stop = await StopService.updateOne(stopId, name, popular, country, timezone);
      res.json({
        stop: stop
      })
    } else {
      res.status(401).json({response: 'Not Authorised.'});
      return;
    }
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});

module.exports = router;
