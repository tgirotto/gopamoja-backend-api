const pg = require('../config/pg');

const BookingService = {
  findAll: async () => {
    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "SELECT \
        bookings.id as id, \
        transactions.amount as amount, \
        transactions.created as created, \
        ticket_requests.first_name as first_name, \
        ticket_requests.last_name as last_name, \
        origins.name as origin_name, \
        destinations.name as destination_name, \
        companies.name as company_name \
        from bookings \
        LEFT JOIN transactions on bookings.transaction_id = transactions.id \
        LEFT JOIN ticket_requests on bookings.ticket_request_id = ticket_requests.id \
        LEFT JOIN segments on ticket_requests.segment_id = segments.id \
        LEFT JOIN stops as origins on origins.id = segments.origin_id \
        LEFT JOIN stops as destinations on destinations.id = segments.destination_id \
        LEFT JOIN routes on segments.route_id = routes.id \
        LEFT JOIN companies on companies.id = routes.company_id"

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
  findLayoutByTripIdAndDateAndStopId: async(tripId, date, stopId) => {
    if(isNaN(tripId)) {
      throw "Trip id not valid"
    }

    if(date == null) {
      throw "Date is not valid"
    }

    if(isNaN(stopId)) {
      throw "Stop id not valid"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN');

      let q0 = "select * \
        from routes \
        left join trips on trips.route_id = routes.id\
        left join vehicles on trips.vehicle_id = vehicles.id\
        where trips.id = $1";

      result = await client.query(q0, [tripId]);

      if(result == null || result.rows == null) {
        throw "bookings get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "invalid trip id"
      }

      let route = result.rows[0];
      let layout = route['layout'];

      let q1 = "select * \
        from route_stops \
        left join stops on route_stops.stop_id = stops.id \
        where route_id = $1 \
        order by route_stops.position";

      result = await client.query(q1, [route['route_id']]);

      if(result == null || result.rows == null) {
        throw "bookings get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "invalid route stops"
      }

      let routeStops = result.rows;

      let q2 = "SELECT \
        segments.route_id as route_id, \
        origins.id as origin_id, \
        destinations.id as destination_id, \
        bookings.id as id, \
        origins.name as origin_name, \
        destinations.name as destination_name, \
        ticket_requests.id as ticket_request_id, \
        ticket_requests.row as row, \
        ticket_requests.column as column, \
        ticket_requests.created as created, \
        ticket_requests.first_name as first_name, \
        ticket_requests.last_name as last_name, \
        ticket_requests.phone as phone, \
        ticket_requests.amount as amount, \
        ticket_requests.reference_number as reference_number \
        from bookings \
        left join ticket_requests on bookings.ticket_request_id = ticket_requests.id \
        left join segments on ticket_requests.segment_id = segments.id \
        left join stops as origins on origins.id = segments.origin_id \
        left join stops as destinations on destinations.id = segments.destination_id \
        where segments.route_id = $1 and date(ticket_requests.date) = date($2)"

      result = await client.query(q2, [route['route_id'], date]);

      if(result == null || result.rows == null) {
        throw "bookings get did not return any result";
      }

      let allBookings = result.rows;
      let overlappingBookings = [];

      if(allBookings.length > 0) {
        let reqStop = routeStops.find((x) => {return x['stop_id'] === stopId});

        if(reqStop == null) {
          throw "could not find positions for the requested stop"
        }

        let reqStopPosition = reqStop['position'];

        if(isNaN(reqStopPosition)) {
          throw "invalid format for req origin position or req destination position"
        }

        let origin, destination, originPosition, destinationPosition;
        let rows = layout.split('\n'), cols, row;

        for(let b of allBookings) {
          origin = routeStops.find((x) => {return x['stop_id'] === b['origin_id']});
          destination = routeStops.find((x) => {return x['stop_id'] === b['destination_id']});

          if(origin == null || destination == null) {
            throw "could not find positions for the b stops"
          }

          originPosition = origin['position'];
          destinationPosition = destination['position'];

          if(isNaN(originPosition) || isNaN(destinationPosition)) {
            throw "invalid format for b origin position or b destination position"
          }

          // (originPosition == reqOriginPosition && destinationPosition == reqDestinationPosition) ||
          // (originPosition < reqOriginPosition && destinationPosition > reqDestinationPosition) ||
          // (originPosition > reqOriginPosition && destinationPosition < reqDestinationPosition) ||
          // (originPosition < reqOriginPosition && originPosition < reqDestinationPosition) ||
          // (originPosition < reqDestinationPosition && destinationPosition > reqDestinationPosition)
          if((originPosition < reqStopPosition && destinationPosition > reqStopPosition) ||
             (originPosition === reqStopPosition)) {
            console.log('found it');
            row = rows[b['row']]
            if(row == null) {
              continue
            }

            rows[b['row']] = row.substr(0, b['column']) + 'b' + row.substr(b['column'] + 1);
            overlappingBookings.push(b)
          }
        }

        layout = rows.join('\n')
      }

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve({
          layout: layout,
          bookings: overlappingBookings
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

module.exports = BookingService;
