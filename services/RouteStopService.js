const pg = require('../config/pg');

const RouteStopService = {
  findByCompanyIdAndDeleted: async (companyId, deleted) => {
    if(isNaN(companyId)) {
      throw "Invalid company id"
    }

    if(typeof deleted !== 'boolean') {
      throw "Deleted is invalid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select \
        route_stops.id as id, \
        routes.id as route_id, \
        route_stops.position as position, \
        stops.name as stop_name \
        from route_stops \
        left join routes on routes.id = route_stops.route_id \
        left join stops on stops.id = route_stops.stop_id \
        where routes.company_id = $1 and routes.deleted = $2 \
        order by position`;

      result = await client.query(q0, [companyId, deleted]);

      if(result == null || result.rows == null) {
        throw "Route stops get did not return any result";
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
  findByDeleted: async(deleted) => {
    if(typeof deleted !== 'boolean') {
      throw "Deleted is invalid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select \
        route_stops.id as id, \
        routes.id as route_id, \
        route_stops.position as position, \
        companies.name as company_name, \
        stops.name as stop_name \
        from route_stops \
        left join routes on routes.id = route_stops.route_id \
        left join stops on stops.id = route_stops.stop_id \
        left join companies on companies.id = routes.company_id \
        where routes.deleted = $1 \
        order by position`;

      result = await client.query(q0, [deleted]);

      if(result == null || result.rows == null) {
        throw "Route stops get did not return any result";
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

module.exports = RouteStopService;
