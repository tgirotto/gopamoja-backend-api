const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const CompanyService = {
  findAll: async () => {
    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select * from companies`;

      result = await client.query(q0);

      if(result == null || result.rows == null) {
        throw "Companies get did not return any result";
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
  findById: async (companyId) => {
    if(isNaN(companyId)) {
      throw "Company id not valid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select * from companies where id = $1`;

      result = await client.query(q0, [companyId]);

      if(result == null || result.rows == null) {
        throw "Companies get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Company not found"
      }

      let company = result.rows[0];

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(company);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  findByUserId: async (userId) => {
    if(isNaN(userId)) {
      throw "User id not valid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select \
        companies.id as id, \
        companies.name as name \
        from companies \
        left join user_companies on user_companies.company_id = companies.id \
        left join users on users.id = user_companies.user_id \
        where users.id = $1`;

      result = await client.query(q0, [userId]);

      if(result == null || result.rows == null) {
        throw "User get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "User not found";
      }

      let user = result.rows[0];

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(user);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  findByRouteId: async (userId) => {
    if(isNaN(userId)) {
      throw "User id not valid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select companies.id as id, companies.name as name \
        from companies \
        left join user_companies on user_companies.company_id = companies.id \
        where user_companies.user_id = $1`;

      result = await client.query(q0, [userId]);

      if(result == null || result.rows == null) {
        throw "User get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "User not found";
      }

      let user = result.rows[0];

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(user);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  insertOne: async(name, country) => {
    if(typeof name !== 'string') {
      throw "Invalid name"
    }

    if(typeof country !== 'string') {
      throw "Invalid country"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "insert into companies (name, country) values ($1, $2) returning *";

      result = await client.query(q0, [name, country]);

      if(result == null || result.rows == null) {
        throw "Company insert did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Company not inserted";
      }

      let company = result.rows[0];

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(company);
      });
    } catch(e) {
      console.log(e.toString());
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  updateById: async (companyId, name, country) => {
    if(isNaN(companyId)) {
      throw "Invalid company id"
    }

    if(typeof country !== 'string') {
      throw "Invalid country"
    }

    if(typeof country !== 'string') {
      throw "Invalid country"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "update companies set name = $1, country = $2 where id =$3 returning *";

      result = await client.query(q0, [name, country, companyId]);

      if(result == null || result.rows == null) {
        throw "Company update did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Company not updated";
      }

      let company = result.rows[0];

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(company);
      });
    } catch(e) {
      console.log(e.toString());
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  }
}

module.exports = CompanyService
