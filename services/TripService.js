const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const RouteStopService = require('./RouteStopService');

const TripService = {
  findAll: async() => {
    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let routeStops = await RouteStopService.findByDeleted(false);

      let routes = [];
      let route;

      for(let rs of routeStops) {
        route = routes.find(x => x.id === rs.route_id);

        if(route == null) {
          route = {
            id: rs.route_id,
            origin_name: rs.stop_name,
            company_name: rs.company_name,
          }

          routes.push(route);
        }

        route['destination_name'] = rs.stop_name;
      }

      let q0 = "SELECT trips.id as id, \
        trips.route_id as route_id, \
        trips.hidden as hidden, \
        trips.days_of_the_week as days_of_the_week \
        FROM trips \
        left join routes on routes.id = trips.route_id \
        left join companies on routes.company_id = companies.id"

      result = await client.query(q0);

      if(result == null || result.rows == null) {
        throw "Trips get did not return any result";
      }

      let trips = result.rows;
      let r;

      for(let t of trips) {
        r = routes.find((x) => {return (x.id === t.route_id)})

        if(r != null) {
          t['route_id'] = r.id;
          t['company_name'] = r.company_name;
          t['origin_name'] = r.origin_name;
          t['destination_name'] = r.destination_name;
        }
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
  findByCompanyIds: async(companyIds) => {
    if(!Array.isArray(companyIds)) {
      throw "Company ids not valid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let params = [];
      for(let i = 1; i <= companyIds.length; i++) {
        params.push('$' + i)
      }

      let q0 = `select \
        trips.id as id, \
        trips.days_of_the_week as days_of_the_week, \
        routes.id as route_id, \
        route_stops.position as position, \
        stops.name as stop_name, \
        companies.name as company_name, \
        companies.id as company_id \
        from trips \
        left join routes on routes.id = trips.route_id \
        left join route_stops on route_stops.route_id = routes.id \
        left join stops on stops.id = route_stops.stop_id \
        left join companies on companies.id = routes.company_id \
        where routes.company_id in (${params.join(',')}) \
        order by position`;

      result = await client.query(q0, companyIds);

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
            days_of_the_week: rs.days_of_the_week,
            company_name: rs.company_name
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
    if(isNaN(tripId)) {
      throw "Trip id is invalid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "select \
        trips.id as id, \
        trips.days_of_the_week as days_of_the_week, \
        companies.id as company_id, \
        trips.hidden as hidden, \
        trips.vehicle_id as vehicle_id, \
        vehicles.layout as layout, \
        companies.name as company_name \
        from trips \
        left join routes on routes.id = trips.route_id \
        left join vehicles on trips.vehicle_id = vehicles.id \
        left join companies on companies.id = routes.company_id \
        where trips.id = $1";

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
        routes.id as route_id, \
        route_stops.position as position, \
        stops.name as stop_name \
        from trips \
        left join routes on routes.id = trips.route_id \
        left join route_stops on route_stops.route_id = routes.id \
        left join stops on stops.id = route_stops.stop_id \
        where trips.id = $1 \
        order by position`;

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
        left join ticket_requests on bookings.ticket_request_id = ticket_requests.id`;

      result = await client.query(q2);

      if(result == null || result.rows == null) {
        throw "Bookings get did not return any result";
      }

      trip['bookings'] = result.rows;

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(trip);
      });
    } catch(e) {
      console.log(e);
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
  },
  updateById: async (tripId, vehicleId, daysOfTheWeek, hidden) => {
    if(isNaN(vehicleId)) {
      throw "Vehicle id not valid"
    }

    if(isNaN(tripId)) {
      throw "Trip id not valid"
    }

    if(!Array.isArray(daysOfTheWeek)) {
      throw 'days of the week are not an array';
    }

    if(typeof hidden !== 'boolean') {
      throw 'hidden invalid';
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "update trips set vehicle_id = $1, days_of_the_week = $2, hidden = $3 where id = $4 returning *";

      result = await client.query(q0, [vehicleId, daysOfTheWeek, hidden, tripId]);

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
