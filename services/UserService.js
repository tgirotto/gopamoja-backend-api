const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const UserService = {
  findById: async(userId) => {
    if(isNaN(userId)) {
      throw "User id not valid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select * \
        from users \
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
  findCompanyById: async (userId) => {
    if(isNaN(userId)) {
      throw "User id not valid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select * \
        from companies \
        left join users on users.company_id = companies.id \
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
  }
}

module.exports = UserService
