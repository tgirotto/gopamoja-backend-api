const pg = require('../config/pg');

const RouteStopService = {
  findByCompanyIdAndDeleted: async (companyId, deleted) => {
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
  findById: async() => {

  }
}

module.exports = RouteStopService;
