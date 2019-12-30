const pg = require('../config/pg');

const VehicleService = {
  findByDeleted: async (deleted) => {
    const client = await pg.connect()
    let result;

    if(typeof deleted !== 'boolean') {
      throw "Invalid deleted"
    }

    try {
      await client.query('BEGIN')

      let q0 = `select vehicles.id as id, \
        vehicles.brand as brand, \
        vehicles.rows * vehicles.columns as capacity, \
        companies.id as company_id, \
        companies.name as company_name \
        from vehicles \
        left join companies on vehicles.company_id = companies.id \
        where deleted = $1`;

      result = await client.query(q0, [deleted]);

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
  findByCompanyIdsAndDeleted: async(companyIds, deleted) => {
    if(!Array.isArray(companyIds)) {
      throw "Company ids is not an array"
    }

    if(typeof deleted !== 'boolean') {
      throw "Invalid deleted"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let params = [];
      for(let i = 2; i < companyIds.length + 2; i++) {
        params.push('$' + i)
      }

      let q0 = `select vehicles.id as id, \
        vehicles.brand as brand, \
        vehicles.rows * vehicles.columns as capacity, \
        companies.id as company_id, \
        companies.name as company_name \
        from vehicles \
        left join companies on vehicles.company_id = companies.id \
        where vehicles.deleted = $1 and company_id in(${params.join(',')})`;

      //probably a bad idea
      companyIds.unshift(false);
      result = await client.query(q0, companyIds);

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
  findByCompanyIdAndDeleted: async (companyId, deleted) => {
    if(isNaN(companyId)) {
      throw "Invalid company id"
    }

    if(typeof deleted !== 'boolean') {
      throw "Invalid deleted"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select vehicles.id as id, \
        vehicles.brand as brand, \
        vehicles.rows * vehicles.columns as capacity, \
        companies.id as company_id, \
        companies.name as company_name \
        from vehicles \
        left join companies on vehicles.company_id = companies.id \
        where company_id = $1 and vehicles.deleted = $2`;

      result = await client.query(q0, [companyId, deleted]);

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
  insertOne: async (brand, wifi, ac, toilet, rows, columns, companyId) => {
    if(isNaN(companyId)) {
      throw "Invalid company id"
    }

    if(isNaN(rows)) {
      throw "Invalid rows"
    }

    if(isNaN(columns)) {
      throw "Invalid columns"
    }

    if(typeof brand !== 'string') {
      throw "Invalid brand"
    }

    if(typeof wifi !== 'boolean') {
      throw "Invalid wifi"
    }

    if(typeof ac !== 'boolean') {
      throw "Invalid ac"
    }

    if(typeof toilet !== 'boolean') {
      throw "Invalid toilet"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `insert into vehicles(brand, wifi, ac, toilet, rows, columns, layout, company_id) values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`;

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
      result = await client.query(q0, [brand, wifi, ac, toilet, rows, columns, layout, companyId]);

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
  updateOne: async (vehicleId, brand, wifi, ac, toilet, rows, columns, companyId) => {
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

    if(typeof brand !== 'string') {
      throw "Invalid brand"
    }

    if(typeof wifi !== 'boolean') {
      throw "Invalid wifi"
    }

    if(typeof ac !== 'boolean') {
      throw "Invalid ac"
    }

    if(typeof toilet !== 'boolean') {
      throw "Invalid toilet"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `update vehicles set \
       brand = $1, \
       wifi = $2, \
       ac = $3, \
       toilet = $4, \
       rows = $5, \
       columns = $6, \
       layout = $7, \
       company_id= $8 \
       where id = $9
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

      result = await client.query(q0, [brand, wifi, ac, toilet, rows, columns, layout, companyId, vehicleId]);

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
