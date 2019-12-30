const pg = require('../config/pg');
const Router = require('express-promise-router');

const VehicleService = require('../services/VehicleService');
const CompanyService = require('../services/CompanyService');
const UserService = require('../services/UserService');
const ManagerService = require('../services/ManagerService');

const router = new Router()

router.get('/', async function(req, res, next) {
  if(!req.session.user_id) {
    res.status(401).json({err: 'Not Authorised.'});
    return;
  }

  let companyId;

  if(req.query.company_id != null) {
    companyId = parseInt(req.query.company_id);

    if(isNaN(companyId)) {
      res.status(500).json({err: "Invalid company id"});
      return;
    }
  }

  try {
    let user = await ManagerService.findById(req.session.user_id);

    if(user == null || user['access_level'] == null) {
      throw "User or user role not defined";
    }

    let vehicles = [];
    if(user['access_level'] === 'admin') {
      if(companyId == null) {
        vehicles = await VehicleService.findByDeleted(false);
      } else {
        vehicles = await VehicleService.findByCompanyIdAndDeleted(companyId, false);
      }
    } else if(user['access_level'] === 'third_party') {
      let companies = await ManagerService.findCompaniesById(user['id']);
      let companyIds = companies.map((x) => {return x['id']});

      if(companyId == null) {
        vehicles = await VehicleService.findByCompanyIdsAndDeleted(companyIds, false);
      } else {
        if(!companyIds.includes(companyId)) {
          throw "user does not have access to that company's data"
        }

        vehicles = await VehicleService.findByCompanyIdAndDeleted(companyId, false);
      }
    } else {
      throw "user access level not found"
    }

    res.json({
      vehicles: vehicles
    })
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.get('/:id', async function(req, res, next) {
  const vehicleId = parseInt(req.params.id)

  if(isNaN(vehicleId)) {
    res.status(500).json({err: 'Vehicle id is invalid'});
    return;
  }

  try {
    let user = await ManagerService.findById(req.session.user_id);

    if(user == null || user['access_level'] == null) {
      throw "User or user role not defined";
    }

    const vehicle = await VehicleService.findById(vehicleId);

    if(user['access_level'] == 'third_party') {
      let companies = await ManagerService.findCompaniesById(user['id']);
      let companyIds = companies.map((x) => {return x['id']});

      if(!companyIds.includes(vehicle['company_id'])) {
        throw "user does not have access to that company's data"
      }
    }

    res.json({
      vehicle: vehicle
    })
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});

router.post('/', async function(req, res, next) {
  const companyId = parseInt(req.body.company_id);
  const brand = req.body.brand;
  const rows = parseInt(req.body.rows);
  const columns = parseInt(req.body.columns);
  const wifi = req.body.wifi;
  const ac = req.body.ac;
  const toilet = req.body.toilet;

  if(isNaN(companyId)) {
    res.status(500).json({err: 'Company id is invalid'});
    return;
  }

  if(isNaN(rows)) {
    res.status(500).json({err: 'Rows is invalid'});
    return;
  }

  if(isNaN(columns)) {
    res.status(500).json({err: 'Columns is invalid'});
    return;
  }

  if(typeof brand !== 'string') {
    res.status(500).json({err: 'Brand is invalid'});
    return;
  }

  if(typeof ac !== 'boolean') {
    res.status(500).json({err: 'Brand is invalid'});
    return;
  }

  if(typeof wifi !== 'boolean') {
    res.status(500).json({err: 'wifi is invalid'});
    return;
  }

  if(typeof toilet !== 'boolean') {
    res.status(500).json({err: 'toilet is invalid'});
    return;
  }

  try {
    const vehicle = await VehicleService.insertOne(brand, wifi, ac, toilet, rows, columns, companyId);
    res.json({
      vehicle: vehicle
    })
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});

router.put('/:id', async function(req, res, next) {
  const companyId = parseInt(req.body.company_id);
  const vehicleId = parseInt(req.params.id)
  const brand = req.body.brand;
  const rows = parseInt(req.body.rows);
  const columns = parseInt(req.body.columns);
  const wifi = req.body.wifi;
  const ac = req.body.ac;
  const toilet = req.body.toilet;

  if(isNaN(companyId)) {
    res.status(500).json({err: 'Company id is invalid'});
    return;
  }

  if(isNaN(vehicleId)) {
    res.status(500).json({err: 'Vehicle id is invalid'});
    return;
  }

  if(isNaN(rows)) {
    res.status(500).json({err: 'Rows is invalid'});
    return;
  }

  if(isNaN(columns)) {
    res.status(500).json({err: 'Columns is invalid'});
    return;
  }

  if(typeof brand !== 'string') {
    res.status(500).json({err: 'Brand is invalid'});
    return;
  }

  if(typeof ac !== 'boolean') {
    res.status(500).json({err: 'Brand is invalid'});
    return;
  }

  if(typeof wifi !== 'boolean') {
    res.status(500).json({err: 'wifi is invalid'});
    return;
  }

  if(typeof toilet !== 'boolean') {
    res.status(500).json({err: 'toilet is invalid'});
    return;
  }

  try {
    const vehicle = await VehicleService.updateOne(vehicleId, brand, wifi, ac, toilet, rows, columns, companyId);
    res.json({
      vehicle: vehicle
    })
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});

module.exports = router;
