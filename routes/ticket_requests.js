const pg = require('../config/pg');
const Router = require('express-promise-router');

const TicketRequestService = require('../services/TicketRequestService');
const ManagerService = require('../services/ManagerService');

const router = new Router()

router.get('/', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  try {
    let user = await ManagerService.findById(req.session.user_id);

    if(user == null || user['access_level'] == null) {
      throw "User or user role not defined";
    }

    let ticketRequests = [];

    if(user['access_level'] === 'admin') {
      ticketRequests = await TicketRequestService.findAll();
    } else if(user['access_level'] === 'third_party') {
      let companies = await ManagerService.findCompaniesById(user['id']);
      let companyIds = companies.map((x) => {return x['id']});
      ticketRequests = await TicketRequestService.findByCompanyIds(companyIds);
    } else {
      throw "invalid access level"
    }

    res.json({
      ticket_requests: ticketRequests
    })
  } catch(e) {
    console.log(e);
    res.status(500).json({e: e.toString()});
  }
});

router.get('/:id', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  try {
    const ticketRequestId = parseInt(req.params.id);

    if(isNaN(ticketRequestId)) {
      res.status(500).json({err: "Invalid ticket request id"});
      return;
    }

    let user = await ManagerService.findById(req.session.user_id);

    if(user == null || user['access_level'] == null) {
      throw "User or user role not defined";
    }

    const ticketRequest = await TicketRequestService.findById(ticketRequestId);

    if(user['access_level'] === 'third_party') {
      //actually we should also change the error status
      let companies = await ManagerService.findCompaniesById(user['id']);
      let company = companies.find((x) => { return x['id'] === ticketRequest['company_id']})

      if(company == null) {
        throw "not authorised"
      }
    }

    res.json({
      ticket_request: ticketRequest
    });
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});


module.exports = router;
