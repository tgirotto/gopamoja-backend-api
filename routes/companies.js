const pg = require('../config/pg');
const Router = require('express-promise-router');

const CompanyService = require('../services/CompanyService');
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
      const companies = await CompanyService.findAll();

      res.json({
        companies: companies
      })
      return;
    } else {
      throw "Not Authorised"
    }
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});

router.get('/:id', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  const companyId = parseInt(req.params.id)

  if(isNaN(companyId)) {
    res.status(500).json({err: 'Company id is invalid'});
    return;
  }

  try {
    let user = await UserService.findById(req.session.user_id);

    if(user == null || user.role == null) {
      throw "User or user role not defined";
    }

    if(user.role === 'admin') {
      const company = await CompanyService.findById(companyId);
      res.json({
        company: company
      })
      return;
    }

    if(user.role === 'third_party') {
      let company = await CompanyService.findByUserId(req.session.user_id);

      if(company == null) {
        throw "This user does not belong to any company";
      }

      res.json({
        company: company
      })

      return;
    }
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
  const country = req.body.country;

  if(typeof name !== 'string') {
    res.status(500).json({err: 'Name is invalid'});
    return;
  }

  if(typeof country !== 'string') {
    res.status(500).json({err: 'Country is invalid'});
    return;
  }

  try {
    let user = await UserService.findById(req.session.user_id);

    if(user == null || user.role == null) {
      throw "User or user role not defined";
    }

    if(user.role === 'admin') {
      const company = await CompanyService.insertOne(name, country);
      res.json({
        company: company
      })
      return;
    } else {
      throw "Not authorised"
    }
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});


router.put('/:id', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({response: 'Not Authorised.'});
    return;
  }

  const companyId = parseInt(req.params.id);
  const name = req.body.name;
  const country = req.body.country;

  if(isNaN(companyId)) {
    res.status(500).json({err: 'Invalid company id'});
    return;
  }

  if(typeof name !== 'string') {
    res.status(500).json({err: 'Name is invalid'});
    return;
  }

  if(typeof country !== 'string') {
    res.status(500).json({err: 'Country is invalid'});
    return;
  }

  try {
    let user = await UserService.findById(req.session.user_id);

    if(user == null || user.role == null) {
      throw "User or user role not defined";
    }

    if(user.role === 'admin') {
      const company = await CompanyService.updateById(companyId, name, country);
      res.json({
        company: company
      })
      return;
    } else {
      throw "Not authorised"
    }
  } catch(e) {
    res.status(500).json({e: e.toString()});
  }
});

module.exports = router;
