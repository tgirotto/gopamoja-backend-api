const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const InsightService = {
  findCities: async() => {
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

      let q1 = "SELECT count(*) as count, destinations.id as destination_id, destinations.name as name \
        FROM journey_requests \
        LEFT JOIN stops as destinations on destinations.id = journey_requests.destination_id \
        GROUP BY destinations.id \
        ORDER BY count(*) desc"

      result = await client.query(q1);

      if(result == null || result.rows == null) {
        throw "Route get did not return any result";
      }

      let destinations = result.rows;

      let q2 = `select origins.name as origin_name, \
        destinations.name as destination_name, \
        count(*) as hits \
        from journey_requests \
        left join stops as origins on origins.id = journey_requests.origin_id \
        left join stops as destinations on destinations.id = journey_requests.destination_id \
        group by origin_name, destination_name \
        order by count(*) desc;`

      result = await client.query(q2);

      if(result == null || result.rows == null) {
        throw "Route get did not return any result";
      }

      let combinations = result.rows;

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
  },
  findUsers: async(topLeftLat, topLeftLon, bottomRightLat, bottomRightLon) => {
    if(isNaN(topLeftLat)) {
      throw "Invalid top left lat"
    }

    if(isNaN(topLeftLon)) {
      throw "Invalid top left lon"
    }

    if(isNaN(bottomRightLat)) {
      throw "Invalid top bottom right lat"
    }

    if(isNaN(bottomRightLon)) {
      throw "Invalid bottom right lan"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = `SELECT * \
        FROM journey_requests \
        where (latitude < $1 and longitude > $2) \
        and (latitude > $3 and longitude < $4) \
        order by created desc limit 200`

      result = await client.query(q0, [topLeftLat, topLeftLon, bottomRightLat, bottomRightLon]);

      if(result == null || result.rows == null) {
        throw "Route get did not return any result";
      }

      let origins = result.rows;

      await client.query('COMMIT')
      return new Promise((resolve, reject) => {
        resolve(result.rows);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}

module.exports = InsightService
