const pg = require('../config/pg');

const stopservice = {
  findAll: async () => {
    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "SELECT * FROM stops;"

      result = await client.query(q0);

      if(result == null || result.rows == null) {
        throw "stops get did not return any result";
      }

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(result.rows);
      });
    } catch(e) {
      console.log(e);
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  findById: async (stopId) => {
    if(isNaN(stopId)) {
      throw "Invalid stop id"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select * from stops where id = $1`;

      result = await client.query(q0, [stopId]);

      if(result == null || result.rows == null) {
        throw "stops get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "stop not found";
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
  insertOne: async (name, popular, country, timezone) => {
    if(typeof name !== 'string') {
      throw "name is invalid"
    }

    if(typeof country !== 'string') {
      throw "country is invalid"
    }

    if(typeof timezone !== 'string') {
      throw "timezone is invalid"
    }

    if(typeof popular !== 'boolean') {
      throw "popular is invalid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `insert into stops(name, popular, country, timezone) values ($1, $2, $3, $4) returning *`;

      result = await client.query(q0, [name, popular, country, timezone]);

      if(result == null || result.rows == null) {
        throw "stop insert did not return any result";
      }

      if(result.rows.length < 1) {
        throw "stop insert did not return any result";
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
  updateOne: async (stopId, name, popular, country, timezone) => {
    if(isNaN(stopId)) {
      throw 'Stop id is invalid'
    }

    if(typeof name !== 'string') {
      throw 'Name is invalid'
    }

    if(typeof country !== 'string') {
      throw 'country is invalid'
    }

    if(typeof timezone !== 'string') {
      throw 'timezone is invalid'
    }

    if(typeof popular !== 'boolean') {
      throw 'popular is invalid'
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `update stops set name = $1, \
       popular = $2, \
       country = $3, \
       timezone = $4 \
       where id = $5
       returning *`;

      result = await client.query(q0, [name, popular, country, timezone, stopId]);

      if(result == null || result.rows == null) {
        throw "Stop update did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Stop update did not return any result";
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

module.exports = stopservice;
