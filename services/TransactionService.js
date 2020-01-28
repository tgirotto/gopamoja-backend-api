const pg = require('../config/pg');

const TransactionService = {
  findAll: async () => {
    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "SELECT \
        transactions.uuid as uuid, \
        transactions.amount as amount, \
        transactions.created as created, \
        ticket_requests.first_name as first_name, \
        ticket_requests.last_name as last_name, \
        origins.name as origin_name, \
        destinations.name as destination_name \
        FROM transactions \
        LEFT JOIN ticket_requests on ticket_requests.id = transactions.ticket_request_id \
        LEFT JOIN segments on ticket_requests.segment_id = segments.id \
        LEFT JOIN stops as origins on origins.id = segments.origin_id \
        LEFT JOIN stops as destinations on destinations.id = segments.destination_id"

      result = await client.query(q0);

      if(result == null || result.rows == null) {
        throw "transactions get did not return any result";
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
  }
}

module.exports = TransactionService;
