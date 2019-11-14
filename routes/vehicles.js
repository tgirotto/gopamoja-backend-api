const pg = require('../config/pg');
const Router = require('express-promise-router');

const VehicleService = require('../services/VehicleService');
const CompanyService = require('../services/CompanyService');
const UserService = require('../services/UserService');

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
    let user = await UserService.findById(req.session.user_id);

    if(user == null || user.role == null) {
      throw "User or user role not defined";
    }

    if(user.role === 'admin') {
      let vehicles;

      if(companyId == null) {
        vehicles = await VehicleService.findByDeleted(false);
      } else {
        vehicles = await VehicleService.findByCompanyIdAndDeleted(companyId, false);
      }

      res.json({
        vehicles: vehicles
      })
      return;
    }

    if(user.role === 'third_party') {
      let company = await CompanyService.findByUserId(req.session.user_id);

      if(company == null) {
        throw "This user does not belong to any company";
      }

      let vehicles = await VehicleService.findByCompanyIdAndDeleted(companyId, false);

      res.json({
        vehicles: vehicles
      })
      return;
    }
  } catch(e) {
    console.log(e);
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
    const vehicle = await VehicleService.findById(vehicleId);
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
  const name = req.body.name;
  const description = req.body.description;
  const brand = req.body.brand;
  const wifi = (req.body.wifi == 'true');
  const ac = (req.body.ac == 'true');
  const rows = parseInt(req.body.rows);
  const columns = parseInt(req.body.columns);

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

  if(typeof name !== 'string') {
    res.status(500).json({err: 'Name is invalid'});
    return;
  }

  if(typeof brand !== 'string') {
    res.status(500).json({err: 'Brand is invalid'});
    return;
  }

  if(typeof description !== 'string') {
    res.status(500).json({err: 'Description is invalid'});
    return;
  }

  try {
    const vehicle = await VehicleService.insertOne(name, description, brand, wifi, ac, rows, columns, companyId);
    res.json({
      vehicle: vehicle
    })
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});

router.put('/:id', async function(req, res, next) {
  const vehicleId = parseInt(req.params.id)
  const name = req.body.name;
  const description = req.body.description;
  const brand = req.body.brand;
  const rows = parseInt(req.body.rows);
  const columns = parseInt(req.body.columns);
  const wifi = (req.body.wifi == 'true');
  const ac = (req.body.ac == 'true');

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

  if(typeof name !== 'string') {
    res.status(500).json({err: 'Name is invalid'});
    return;
  }

  if(typeof brand !== 'string') {
    res.status(500).json({err: 'Brand is invalid'});
    return;
  }

  if(typeof description !== 'string') {
    res.status(500).json({err: 'Description is invalid'});
    return;
  }

  try {
    const vehicle = await VehicleService.updateOne(vehicleId, name, description, brand, wifi, ac, rows, columns, 1);
    res.json({
      vehicle: vehicle
    })
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});

module.exports = router;
