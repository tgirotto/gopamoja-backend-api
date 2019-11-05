const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const TripService = {
  findByCompanyId: async(companyId) => {
    if(isNaN(companyId)) {
      throw "Company id not valid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = `select \
        trips.id as id, \
        trips.days_of_the_week as days_of_the_week, \
        routes.id as route_id, \
        route_stops.position as position, \
        stops.name as stop_name \
        from trips \
        left join routes on routes.id = trips.route_id \
        left join route_stops on route_stops.route_id = routes.id \
        left join stops on stops.id = route_stops.stop_id \
        where routes.company_id = $1 \
        order by position`;

      result = await client.query(q0, [companyId]);

      if(result == null || result.rows == null) {
        throw "Stops get did not return any result";
      }

      let routeStops = result.rows;
      // console.log(routeStops.length);
      let trips = [];
      let route;

      for(let rs of routeStops) {
        route = trips.find(x => x.id === rs.id);

        if(route == null) {
          route = {
            id: rs.id,
            date: rs.date,
            origin_name: rs.stop_name,
            days_of_the_week: rs.days_of_the_week
          }

          trips.push(route);
        }

        route['destination_name'] = rs.stop_name;
      }

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(trips);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  findById: async (tripId) => {
    if(typeof tripId !== 'string') {
      throw "Trip id is invalid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "select * from trips where id = $1";

      result = await client.query(q0, [tripId]);

      if(result == null || result.rows == null) {
        throw "Trips get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Trip not found";
      }

      let trip = result.rows[0];

      let q1 = `select \
        trips.id as id, \
        trips.date as date, \
        routes.id as route_id, \
        route_stops.position as position, \
        stops.name as stop_name \
        from trips \
        left join routes on routes.id = trips.route_id \
        left join route_stops on route_stops.route_id = routes.id \
        left join stops on stops.id = route_stops.stop_id \
        where trips.id = $1 \
        order by date, position`;

      result = await client.query(q1, [tripId]);

      if(result == null || result.rows == null) {
        throw "Trips get did not return any result";
      }

      trip['stops'] = result.rows;

      let q2 = `select ticket_requests.first_name as first_name, \
        ticket_requests.last_name as last_name, \
        ticket_requests.phone as phone, \
        ticket_requests.amount as amount, \
        ticket_requests.created as created \
        from bookings \
        left join journeys on journeys.id = bookings.journey_id \
        left join ticket_requests on bookings.ticket_request_id = ticket_requests.id \
        where journeys.trip_id = $1`;

      result = await client.query(q2, [tripId]);

      if(result == null || result.rows == null) {
        throw "Bookings get did not return any result";
      }

      trip['bookings'] = result.rows;

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(trip);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  insertOne: async (vehicleId, routeId, daysOfTheWeek) => {
    if(isNaN(vehicleId)) {
      throw "Vehicle id not valid"
    }

    if(isNaN(routeId)) {
      throw "Route id not valid"
    }

    if(!Array.isArray(daysOfTheWeek)) {
      throw 'days of the week are not an array';
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "insert into trips (vehicle_id, route_id, days_of_the_week) values ($1, $2, $3) returning *";

      result = await client.query(q0, [vehicleId, routeId, daysOfTheWeek]);

      if(result == null || result.rows == null) {
        throw "Trips insert did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Trip not inserted";
      }

      let trip = result.rows[0];

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(trip);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  }
};

module.exports = TripService;
