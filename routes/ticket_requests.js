const pg = require('../config/pg');
const Router = require('express-promise-router');

const TicketRequestService = require('../services/TicketRequestService');
const UserService = require('../services/UserService');

const router = new Router()

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
      const ticketRequests = await TicketRequestService.findAll();

      res.json({
        ticket_requests: ticketRequests
      })
      return;
    }

    //if user is a third_party....
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});


router.get('/:id', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  const ticketRequestId = parseInt(req.params.id);

  if(isNaN(ticketRequestId)) {
    res.status(500).json({err: "Invalid ticket request id"});
    return;
  }

  try {
    let user = await UserService.findById(req.session.user_id);

    if(user == null || user.role == null) {
      throw "User or user role not defined";
    }

    if(user.role === 'admin') {
      const ticketRequest = await TicketRequestService.findById(ticketRequestId);
      res.json({
        ticket_request: ticketRequest
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


module.exports = router;
