const pg = require('../config/pg');

const VehicleService = {
  findAll: async () => {
    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select * from vehicles`;

      result = await client.query(q0);

      if(result == null || result.rows == null) {
        throw "Vehicles get did not return any result";
      }

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(result.rows);
      });

    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  findByCompanyId: async (companyId) => {
    if(isNaN(companyId)) {
      throw "Invalid company id"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select * from vehicles where company_id = $1`;

      result = await client.query(q0, [companyId]);

      if(result == null || result.rows == null) {
        throw "Vehicles get did not return any result";
      }

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(result.rows);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  findById: async (vehicleId) => {
    if(isNaN(vehicleId)) {
      throw "Invalid vehicle id"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select * from vehicles where id = $1`;

      result = await client.query(q0, [vehicleId]);

      if(result == null || result.rows == null) {
        throw "Vehicles get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Vehicle not found";
      }

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(result.rows[0]);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  insertOne: async (name, description, brand, wifi, ac, rows, columns, companyId) => {
    if(isNaN(companyId)) {
      throw "Invalid company id"
    }

    if(isNaN(rows)) {
      throw "Invalid rows"
    }

    if(isNaN(columns)) {
      throw "Invalid columns"
    }

    if(typeof name !== 'string') {
      throw "Invalid name"
    }

    if(typeof brand !== 'string') {
      throw "Invalid brand"
    }

    if(typeof description !== 'string') {
      throw "Invalid description"
    }

    if(typeof wifi !== 'boolean') {
      throw "Invalid wifi"
    }

    if(typeof ac !== 'boolean') {
      throw "Invalid ac"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `insert into vehicles(name, description, brand, wifi, ac, rows, columns, layout, company_id) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`;

      let seats = [];
      for(let r = 0; r < rows; r++) {
        for(let c = 0; c < columns; c++) {
          seats.push({
            row: r,
            column: c,
            hidden: false
          });
        }
      }

      const layout = JSON.stringify(seats);
      result = await client.query(q0, [name, description, brand, wifi, ac, rows, columns, layout, companyId]);

      if(result == null || result.rows == null) {
        throw "Vehicles insert did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Vehicles insert did not return any result";
      }

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(result.rows[0]);
      });

    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  updateOne: async (vehicleId, name, description, brand, wifi, ac, rows, columns, companyId) => {
    if(isNaN(vehicleId)) {
      throw "Invalid vehicle id"
    }

    if(isNaN(rows)) {
      throw "Invalid rows"
    }

    if(isNaN(columns)) {
      throw "Invalid columns"
    }

    if(isNaN(companyId)) {
      throw "Invalid company id"
    }

    if(typeof name !== 'string') {
      throw "Invalid name"
    }

    if(typeof brand !== 'string') {
      throw "Invalid brand"
    }

    if(typeof description !== 'string') {
      throw "Invalid description"
    }

    if(typeof wifi !== 'boolean') {
      throw "Invalid wifi"
    }

    if(typeof ac !== 'boolean') {
      throw "Invalid ac"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `update vehicles set name = $1, \
       description = $2, \
       brand = $3, \
       wifi = $4, \
       ac = $5, \
       rows = $6, \
       columns = $7, \
       layout = $8, \
       company_id= $9 \
       where id = $10
       returning *`;

      let seats = [];
      for(let r = 0; r < rows; r++) {
       for(let c = 0; c < columns; c++) {
         seats.push({
           row: r,
           column: c,
           hidden: false
         });
       }
      }

      const layout = JSON.stringify(seats);

      result = await client.query(q0, [name, description, brand, wifi, ac, rows, columns, layout, companyId, vehicleId]);

      if(result == null || result.rows == null) {
        throw "Vehicles update did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Vehicles update did not return any result";
      }

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(result.rows[0]);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  }
}

module.exports = VehicleService;
