const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const ManagerService = {
  findById: async(id) => {
    if(isNaN(id)) {
      throw "Manager id not valid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select * \
        from managers \
        where managers.id = $1`;

      result = await client.query(q0, [id]);

      if(result == null || result.rows == null) {
        throw "managers get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "managers not found";
      }

      let manager = result.rows[0];
      console.log(manager);

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(manager);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  findCompaniesById: async (managerId) => {
    if(isNaN(managerId)) {
      throw "Manager id not valid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select companies.id as id \
        from manager_companies \
        left join companies on manager_companies.company_id = companies.id \
        left join managers on managers.id = manager_companies.manager_id \
        where managers.id = $1`;

      result = await client.query(q0, [managerId]);

      if(result == null || result.rows == null) {
        throw "Manager get did not return any result";
      }

      let companies = result.rows;

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(companies);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  }
}

module.exports = ManagerService
