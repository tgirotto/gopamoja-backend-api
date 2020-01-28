const pg = require('../config/pg');

const BookingService = {
  findAll: async () => {
    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "SELECT * from agents"

      result = await client.query(q0);

      if(result == null || result.rows == null) {
        throw "agents get did not return any result";
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
  findByCompanyId: async (id) => {
    if(isNaN(id)) {
      throw "invalid id"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "SELECT * \
        from agents \
        left join agent_companies on agents.id = agent_companies.agent_id \
        left join companies on companies.id = agent_companies.company_id \
        where agents.id = $1"

      result = await client.query(q0);

      if(result == null || result.rows == null) {
        throw "bookings get did not return any result";
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
  findById: async (agentId) => {
    if(isNaN(agentId)) {
      throw "Invalid agent id"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select * from agents where id = $1`;

      result = await client.query(q0, [agentId]);

      if(result == null || result.rows == null) {
        throw "Agent get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Agent not found";
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
  insertOne: async (companyId, firstName, lastName, phone) => {
    if(isNaN(companyId)) {
      throw "Invalid company id"
    }

    if(typeof firstName !== 'string') {
      throw "Invalid firstName"
    }

    if(typeof lastName !== 'string') {
      throw "Invalid lastName"
    }

    if(typeof phone !== 'string') {
      throw "Invalid phone"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "select * from agents where phone = $1 and company_id = $2"

      result = await client.query(q0, [phone, companyId]);
      if(result == null || result.rows == null) {
        throw "Agent get did not return any result";
      }

      if(result.rows.length > 0) {
        throw "Agent already registered for this company"
      }

      let q1 = "insert into agents(first_name, last_name, phone, company_id) values($1, $2, $3, $4) returning *";

      result = await client.query(q1, [firstName, lastName, phone, companyId]);

      if(result == null || result.rows == null) {
        throw "Agent insert did not return any result";
      }

      if(result.rows.length < 1) {
        throw "could not insert the agent"
      }

      let agent = result.rows[0];

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(agent);
      });

    } catch(e) {
      console.log(e);
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  updateOne: async (agentId, firstName, lastName, phone) => {
    if(isNaN(agentId)) {
      throw "Invalid agent id"
    }

    if(typeof firstName !== 'string') {
      throw "Invalid first name"
    }

    if(typeof lastName !== 'string') {
      throw "Invalid last name"
    }

    if(typeof phone !== 'string') {
      throw "Invalid phone"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `update agents set \
       first_name = $1, \
       last_name = $2, \
       phone = $3 \
       where id = $4 \
       returning *`;

      result = await client.query(q0, [firstName, lastName, phone, agentId]);

      if(result == null || result.rows == null) {
        throw "Agent update did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Agent update did not return any result";
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

module.exports = BookingService;
