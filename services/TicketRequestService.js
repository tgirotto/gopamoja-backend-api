const pg = require('../config/pg');

const TicketRequestService = {
  findAll: async () => {
    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "SELECT \
        ticket_requests.id as id, \
        ticket_requests.first_name as first_name, \
        ticket_requests.last_name as last_name, \
        ticket_requests.phone as phone, \
        ticket_requests.created as created, \
        ticket_requests.date as date, \
        origins.name as origin_name, \
        destinations.name as destination_name, \
        companies.name as company_name \
        FROM ticket_requests \
        left join segments on ticket_requests.segment_id = segments.id \
        left join stops as origins on origins.id = segments.origin_id \
        left join stops as destinations on destinations.id = segments.destination_id \
        left join routes on segments.route_id = routes.id \
        left join companies on routes.company_id = companies.id"

      result = await client.query(q0);

      if(result == null || result.rows == null) {
        throw "Ticket requests get did not return any result";
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
  findById: async (ticketRequestId) => {
    if(isNaN(ticketRequestId)) {
      throw "Ticket request id not valid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "SELECT \
        ticket_requests.id as id, \
        ticket_requests.first_name as first_name, \
        ticket_requests.last_name as last_name, \
        ticket_requests.phone as phone, \
        ticket_requests.created as created, \
        ticket_requests.date as date, \
        ticket_requests.amount as amount, \
        origins.name as origin_name, \
        destinations.name as destination_name, \
        segments.price as price, \
        companies.name as company_name, \
        companies.id as company_id \
        FROM ticket_requests \
        left join segments on ticket_requests.segment_id = segments.id \
        left join stops as origins on origins.id = segments.origin_id \
        left join stops as destinations on destinations.id = segments.destination_id \
        left join routes on segments.route_id = routes.id \
        left join companies on routes.company_id = companies.id \
        where ticket_requests.id = $1"

      result = await client.query(q0, [ticketRequestId]);

      if(result == null || result.rows == null) {
        throw "Ticket requests get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Ticket request not found"
      }

      let ticketRequest = result.rows[0];

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(ticketRequest);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  findByCompanyIds: async (companyIds) => {
    if(!Array.isArray(companyIds)) {
      throw "companyIds not valid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let params = [];
      for(let i = 1; i <= companyIds.length; i++) {
        params.push('$' + i)
      }

      let q0 = "SELECT \
        ticket_requests.id as id, \
        ticket_requests.first_name as first_name, \
        ticket_requests.last_name as last_name, \
        ticket_requests.phone as phone, \
        ticket_requests.created as created, \
        ticket_requests.date as date, \
        origins.name as origin_name, \
        destinations.name as destination_name, \
        companies.name as company_name \
        FROM ticket_requests \
        left join segments on ticket_requests.segment_id = segments.id \
        left join stops as origins on origins.id = segments.origin_id \
        left join stops as destinations on destinations.id = segments.destination_id \
        left join routes on segments.route_id = routes.id \
        left join companies on routes.company_id = companies.id \
        where companies.id in (" + params.join(', ') + ")"

      result = await client.query(q0, companyIds);

      if(result == null || result.rows == null) {
        throw "Ticket requests get did not return any result";
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
  }
}

module.exports = TicketRequestService;
