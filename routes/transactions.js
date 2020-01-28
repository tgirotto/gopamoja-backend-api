const pg = require('../config/pg');
const Router = require('express-promise-router');

const TransactionService = require('../services/TransactionService');

const router = new Router()

router.get('/', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  try {
    const transactions = await TransactionService.findAll();
    res.json({
      transactions: transactions
    })
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});

module.exports = router;
