const pg = require('../config/pg');
const Router = require('express-promise-router');

const VehicleService = require('../services/VehicleService');

const router = new Router()

router.get('/', async function(req, res, next) {
  try {
    const vehicles = await VehicleService.findByCompanyId(1);
    res.json({
      vehicles: vehicles
    })
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
  const name = req.body.name;
  const description = req.body.description;
  const brand = req.body.brand;
  const wifi = (req.body.wifi == 'true');
  const ac = (req.body.ac == 'true');
  const rows = parseInt(req.body.rows);
  const columns = parseInt(req.body.columns);

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
    const vehicle = await VehicleService.insertOne(name, description, brand, wifi, ac, rows, columns, 1);
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
  console.log(req.body.wifi);
  console.log(req.body.ac);
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
