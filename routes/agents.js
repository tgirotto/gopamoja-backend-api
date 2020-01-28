const pg = require('../config/pg');
const Router = require('express-promise-router');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const AgentService = require('../services/AgentService');
const ManagerService = require('../services/ManagerService');

const router = new Router()

router.get('/', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  try {
    const agents = await AgentService.findAll();
    res.json({
      agents: agents
    })
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});

router.get('/:id', async function(req, res, next) {
  const agentId = parseInt(req.params.id)

  if(isNaN(agentId)) {
    res.status(500).json({err: 'Agent id is invalid'});
    return;
  }

  try {
    let user = await ManagerService.findById(req.session.user_id);

    if(user == null || user['access_level'] == null) {
      throw "User or user role not defined";
    }

    const vehicle = await AgentService.findById(agentId);

    if(user['access_level'] == 'third_party') {
      let companies = await ManagerService.findCompaniesById(user['id']);
      let companyIds = companies.map((x) => {return x['id']});

      if(!companyIds.includes(vehicle['company_id'])) {
        throw "user does not have access to that company's data"
      }
    }  else if(user['access_level'] === 'admin') {
      let agent = await AgentService.findById(agentId);

      res.json({
        agent: agent
      })
    }
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.post('/', async function(req, res, next) {
  let firstName = req.body.first_name;
  let lastName = req.body.last_name;
  let phone = req.body.phone;

  if(typeof firstName !== 'string') {
    res.status(500).json({err: 'firstName is invalid'});
    return;
  }

  if(typeof lastName !== 'string') {
    res.status(500).json({err: 'last name is invalid'});
    return;
  }

  if(typeof phone !== 'string') {
    res.status(500).json({err: 'phone is invalid'});
    return;
  }

  try {
    let user = await ManagerService.findById(req.session.user_id);

    if(user == null || user['access_level'] == null) {
      throw "User or user role not defined";
    }

    if(user['access_level'] == 'third_party') {
      let companies = await ManagerService.findCompaniesById(user['id']);
      let companyIds = companies.map((x) => {return x['id']});


    }  else if(user['access_level'] === 'admin') {
      //TODO: remove hardcoded value
      const agent = await AgentService.insertOne(2, firstName, lastName, phone);
      res.json({
        agent: agent
      })
    }
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.put('/:id', async function(req, res, next) {
  const agentId = parseInt(req.params.id)
  const firstName = req.body.first_name;
  const lastName = req.body.last_name;
  const phone = req.body.phone;

  if(isNaN(agentId)) {
    res.status(500).json({err: 'agent id is invalid'});
    return;
  }

  if(typeof firstName !== 'string') {
    res.status(500).json({err: 'first name is invalid'});
    return;
  }

  if(typeof lastName !== 'string') {
    res.status(500).json({err: 'last name is invalid'});
    return;
  }

  if(typeof phone !== 'string') {
    res.status(500).json({err: 'phone is invalid'});
    return;
  }

  try {
    const agent = await AgentService.updateOne(agentId, firstName, lastName, phone);
    res.json({
      agent: agent
    })
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});


module.exports = router;
