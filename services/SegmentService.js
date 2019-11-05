const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const SegmentService = {
  findByOriginNameAndDestinationNameAndDate: async (originName, destinationName, date) => {
    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "SELECT count(*) as count, origins.id as origin_id, origins.name as name \
        FROM journey_requests \
        LEFT JOIN stops as origins on origins.id = journey_requests.origin_id \
        GROUP BY origins.id \
        ORDER BY count(*) desc"

      result = await client.query(q0);

      if(result == null || result.rows == null) {
        throw "Route get did not return any result";
      }

      let origins = result.rows;

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve({
          top_origins: origins,
          top_destinations: destinations,
          top_combinations: combinations
        });
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  }
}

module.exports = SegmentService;
