const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const SCHEDULE_DAYS_INTO_THE_FUTURE = 3;

const RouteService = {
  findById: async (routeId) => {
    if(isNaN(routeId)) {
      throw "Route id invalid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "SELECT routes.id as id, \
        routes.company_id as company_id \
        FROM routes \
        where routes.id = $1";

      result = await client.query(q0, [routeId]);

      if(result == null || result.rows == null) {
        throw "Stops get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Route not found."
      }

      let route = result.rows[0];

      let q1 = `select \
        route_stops.id as id, \
        route_stops.stop_id as stop_id, \
        routes.id as route_id, \
        route_stops.position as position, \
        route_stops.departure_day as departure_day, \
        route_stops.departure_hour as departure_hour, \
        route_stops.departure_minute as departure_minute, \
        stops.name as stop_name \
        from route_stops \
        left join routes on routes.id = route_stops.route_id \
        left join stops on stops.id = route_stops.stop_id \
        where routes.id = $1 and route_stops.deleted = $2 \
        order by position`;

      result = await client.query(q1, [routeId, false]);

      if(result == null || result.rows == null) {
        throw "Stops get did not return any result";
      }

      route['stops'] = result.rows;

      let q2 = `select \
        segments.id as id, \
        segments.route_id as route_id, \
        segments.origin_id as origin_id, \
        segments.destination_id as destination_id, \
        segments.price, \
        segments.departure_day, \
        segments.departure_hour, \
        segments.departure_minute, \
        segments.arrival_day, \
        segments.arrival_hour, \
        segments.arrival_minute, \
        segments.hidden, \
        origins.name as origin_name, \
        destinations.name as destination_name \
        from segments \
        left join stops as origins on origins.id = segments.origin_id \
        left join stops as destinations on destinations.id = segments.destination_id \
        where route_id = $1`;

      result = await client.query(q2, [routeId]);

      if(result == null || result.rows == null) {
        throw "Segments get did not return any result";
      }

      route['segments'] = result.rows;

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(route);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  insertOne: async(companyId, stops) => {
    if(isNaN(companyId)) {
      throw "Company id invalid"
    }

    if(!Array.isArray(stops)) {
      throw "Stops invalid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "INSERT INTO routes(company_id) VALUES ($1) returning *;"

      result = await client.query(q0, [companyId]);
      if(result == null || result.rows == null) {
        throw "Route insert did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Route insert did not return any result";
      }

      let q1 = "select routes.id as id, \
        companies.id as company_id, \
        companies.name as company_name \
        from routes \
        left join companies on companies.id = routes.company_id \
        where routes.id = $1";

      result = await client.query(q1, [result.rows[0].id]);

      if(result == null || result.rows == null) {
        throw "Route get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Route get did not return any result";
      }

      let route = result.rows[0];

      let rows = [];
      let s;
      for(let i = 0; i < stops.length; i++) {
        s = stops[i];
        rows.push([route.id, s.stop_id, i, s.departure_day, s.departure_hour, s.departure_minute]);
      }

      let q2 = format(`INSERT INTO route_stops(\
        route_id, \
        stop_id, \
        position, \
        departure_day, \
        departure_hour, \
        departure_minute \
      ) VALUES %L returning *`, rows);

      result = await client.query(q2);

      if(result == null || result.rows == null) {
        throw "Route stops insert did not return any result";
      }

      route['stops'] = result.rows;

      let segments = [];
      for(let i = 0; i < stops.length; i++) {
        for(let j = i + 1; j < stops.length; j++) {
          segments.push([
            route.id,
            stops[i].stop_id,
            stops[j].stop_id,
            stops[i].departure_day,
            stops[i].departure_hour,
            stops[i].departure_minute,
            stops[j].departure_day,
            stops[j].departure_hour,
            stops[j].departure_minute])
        }
      }

      let q3 = format(`INSERT INTO segments(\
        route_id, \
        origin_id, \
        destination_id, \
        departure_day, \
        departure_hour, \
        departure_minute, \
        arrival_day, \
        arrival_hour, \
        arrival_minute \
      ) VALUES %L returning *`, segments);

      result = await client.query(q3);

      if(result == null || result.rows == null) {
        throw "Segments insert did not return any result";
      }

      let q4 = `select \
        segments.id as id, \
        segments.route_id as route_id, \
        segments.origin_id as origin_id, \
        segments.destination_id as destination_id, \
        segments.price, \
        segments.departure_day, \
        segments.departure_hour, \
        segments.departure_minute, \
        segments.arrival_day, \
        segments.arrival_hour, \
        segments.arrival_minute, \
        segments.hidden, \
        origins.name as origin_name, \
        destinations.name as destination_name \
        from segments \
        left join stops as origins on origins.id = segments.origin_id \
        left join stops as destinations on destinations.id = segments.destination_id \
        where route_id = $1`;

      result = await client.query(q4, [route.id]);

      if(result == null || result.rows == null) {
        throw "Segments get did not return any result";
      }

      route['segments'] = result.rows;

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(route);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  updateSegmentsByRouteId: async(routeId, segments) => {
    if(isNaN(routeId)) {
      throw "Invalid route id"
    }

    if(!Array.isArray(segments)) {
      throw "Segments are not an array"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "select routes.id as id, \
        companies.id as company_id, \
        companies.name as company_name \
        from routes \
        left join companies on companies.id = routes.company_id \
        where routes.id = $1";

      result = await client.query(q0, [routeId]);

      if(result == null || result.rows == null) {
        throw "Route get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Route get did not return any result";
      }

      let route = result.rows[0];

      let processedSegments = segments.map((s) => {
        return [
          s.id,
          s.route_id,
          s.origin_id,
          s.destination_id,
          s.departure_day,
          s.departure_hour,
          s.departure_minute,
          s.arrival_day,
          s.arrival_hour,
          s.arrival_minute,
          s.price,
          s.hidden]
      });

      let q1 = format(`INSERT INTO segments(\
        id,
        route_id, \
        origin_id, \
        destination_id, \
        departure_day, \
        departure_hour, \
        departure_minute, \
        arrival_day, \
        arrival_hour, \
        arrival_minute, \
        price, \
        hidden \
      ) VALUES %L on conflict (id) do update set \
        route_id = excluded.route_id, \
        origin_id = excluded.origin_id, \
        destination_id = excluded.destination_id, \
        departure_day = excluded.departure_day, \
        departure_hour = excluded.departure_hour, \
        departure_minute = excluded.departure_minute, \
        arrival_day = excluded.arrival_day, \
        arrival_hour = excluded.arrival_hour, \
        arrival_minute = excluded.arrival_minute, \
        price = excluded.price, \
        hidden = excluded.hidden \
      `, processedSegments);

      result = await client.query(q1);

      if(result == null || result.rows == null) {
        throw "Segments insert did not return any result";
      }

      let q2 = `select \
        segments.id as id, \
        segments.route_id as route_id, \
        segments.origin_id as origin_id, \
        segments.destination_id as destination_id, \
        segments.price, \
        segments.departure_day, \
        segments.departure_hour, \
        segments.departure_minute, \
        segments.arrival_day, \
        segments.arrival_hour, \
        segments.arrival_minute, \
        segments.hidden, \
        origins.name as origin_name, \
        destinations.name as destination_name \
        from segments \
        left join stops as origins on origins.id = segments.origin_id \
        left join stops as destinations on destinations.id = segments.destination_id \
        where route_id = $1`;

      result = await client.query(q2, [route.id]);

      if(result == null || result.rows == null) {
        throw "Segments get did not return any result";
      }

      route['segments'] = result.rows;
      //here

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(route);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  },
  updateScheduleByRouteId: async(daysOfTheWeek, weeksOfTheMonth, monthsOfTheYear, routeId) => {
    if(isNaN(routeId)) {
      throw "Invalid route id"
    }

    if(!Array.isArray(daysOfTheWeek)) {
      throw "Invalid days of the week"
    }

    if(!Array.isArray(weeksOfTheMonth)) {
      throw "Invalid weeks of the month"
    }

    if(!Array.isArray(monthsOfTheYear)) {
      throw "Invalid months of the year"
    }

    let start = moment().startOf('day');
    let end = moment().startOf('day').add(SCHEDULE_DAYS_INTO_THE_FUTURE, 'days');

    if(end.isBefore(start)) {
      res.status(500).json({err: "End date is before start date. Try switching them."});
      return
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "UPDATE routes set days_of_the_week = $1, weeks_of_the_month = $2, months_of_the_year = $3 where id = $4 returning *";

      result = await client.query(q0, [daysOfTheWeek, weeksOfTheMonth, monthsOfTheYear, routeId]);

      if(result == null || result.rows == null) {
        throw "Route update did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Route update did not return any result";
      }

      let q1 = "select routes.id as id, \
        vehicles.layout as vehicle_layout, \
        vehicles.id as vehicle_id, \
        routes.days_of_the_week as days_of_the_week, \
        routes.weeks_of_the_month as weeks_of_the_month, \
        routes.months_of_the_year as months_of_the_year, \
        companies.id as company_id, \
        companies.name as company_name \
        from routes \
        left join companies on routes.company_id = companies.id \
        left join vehicles on routes.vehicle_id = vehicles.id \
        where routes.id = $1";

      result = await client.query(q1, [routeId]);

      if(result == null || result.rows == null) {
        throw "Deletion of journeys get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Route get did not return any result";
      }

      let route = result.rows[0];

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(route);
      })
    } catch(e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  },
  cloneById: async (companyId, routeId) => {
    if(isNaN(companyId)) {
      throw "Invalid company id"
    }

    if(isNaN(routeId)) {
      throw "Invalid route id"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "INSERT INTO routes(company_id) VALUES ($1) returning *;"

      result = await client.query(q0, [companyId]);

      if(result == null || result.rows == null) {
        throw "Route insert did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Route insert did not return any result";
      }

      let route = result.rows[0];

      let q1 = "SELECT * from route_stops where route_id = $1";

      result = await client.query(q1, [routeId]);

      if(result == null || result.rows == null) {
        throw "Route get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Route not found."
      }

      let routeStops = result.rows;

      let processedRouteStops = routeStops.map((s) => {
        return [
          route.id,
          s.stop_id,
          s.position,
          s.departure_day,
          s.departure_hour,
          s.departure_minute
        ]
      });

      let q2 = format(`INSERT INTO route_stops(\
        route_id, \
        stop_id, \
        position, \
        departure_day, \
        departure_hour, \
        departure_minute) values %L \
        returning *`, processedRouteStops);

      console.log(q2);
      result = await client.query(q2);

      if(result == null || result.rows == null) {
        throw "Route stops clone did not return any result";
      }

      if(result.rows.length !== routeStops.length) {
        throw "Route stop clone did not return any result";
      }

      let q3 = "SELECT * FROM segments where route_id = $1";

      result = await client.query(q3, [routeId]);

      if(result == null || result.rows == null) {
        throw "Route stops clone did not return any result";
      }

      if(result.rows.length < 1) {
        throw "No segments found"
      }

      let segments = result.rows;

      let processedSegments = segments.map((s) => {
        return [
          route['id'],
          s.origin_id,
          s.destination_id,
          s.departure_day,
          s.departure_hour,
          s.departure_minute,
          s.arrival_day,
          s.arrival_hour,
          s.arrival_minute,
          s.price,
          s.hidden]
      });

      let q4 = format(`INSERT INTO segments(\
        route_id, \
        origin_id, \
        destination_id, \
        departure_day, \
        departure_hour, \
        departure_minute, \
        arrival_day, \
        arrival_hour, \
        arrival_minute, \
        price, \
        hidden \
      ) VALUES %L returning *`, processedSegments);

      result = await client.query(q4);

      if(result == null || result.rows == null) {
        throw "Route segments clone did not return any result";
      }

      if(result.rows.length !== segments.length) {
        throw "Route segments clone did not return an expected result";
      }

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(route);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }

  }
}

module.exports = RouteService;
