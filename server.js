/* eslint-disable no-undef */
/*  */
/*  */
/*  */
'use strict';

const express = require( 'express' );
const server = express();

//
require( 'dotenv' ).config();
const cors = require( 'cors' );
server.use( cors() );
const pg = require( 'pg' );
//
const PORT = process.env.PORT || 3000;

// server.get( '/location', locationHandler );

server.get( '/newLocation',addNewLocation );

const client = new pg.Client ( {
  connectionString:process.env.DATABASE_URL,
  // ssl:{rejectUnauthorized:false}
} );



const superagent = require( 'superagent' );

server.get( '/',( req,res )=>{
  res.send( 'CITY EXPLORER ' );
} );







function addNewLocation ( req , res ){
  console.log( req.query );
  let search_query = req.query.search_query;
  let formatted_query = req.query.formatted_query;
  let latitude = req.query.lat;
  let longitude = req.query.lon;
  let SQL = 'INSERT INTO locations (search_query,formatted_query,latitude ,longitude ) VALUES ($1,$2,$3,$4) RETURNING *;';
  let safeValues = [search_query, formatted_query,latitude,longitude];
  client.query( SQL,safeValues )
    .then( result =>{
      // res.send('Your data was successfuly!');
      res.send( result.rows[0] );
    } )
    .catch( error=>{
      res.send( error );
    } );
}


server.get( '/location',( req,res )=>{
  let cityName = req.query.city;
  let key = process.env.GEOCODE_API_KEY;
  let localURL = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
  // get data from database
  let SQL = `SELECT * FROM locations  RETURNING *;`;
  client.query( SQL )
    .then( result =>{
      // check if it is  existed in database (send the response)
      if ( newLocation ){
        res.send( result.rows[0] );
        console.log( result.rows[0] );
      }
      // if it is not existed send request to API server
      else
        superagent.get( localURL )
          .then( getData =>{
            console.log( getData );
            let locationData = getData.body;
            let newLocation = new Location ( cityName ,locationData );

            res.send( newLocation );
            console.log( newLocation );
            console.log( getData );

          } );
          
    } )
    .catch ( error=>{
      res.send( error );
    } );
} );

function Location( cityName ,loData ){
  this.search_query = cityName;
  this.formatted_query = loData[0].display_name;
  this.latitude = loData[0].lat;
  this.longitude = loData[0].lon;

}


server.get( '/weather',( req,res )=>{
  let cityName = req.query.search_query;
  let weatherKey = process.env.WEATHER_API_KEY;
  let weatherUrl = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${weatherKey}`;
  superagent.get( weatherUrl )
    .then( weatherData =>{
      let wData = weatherData.body;
      let weatherARR = [];
      wData.data.map( weathX =>{
        weatherARR.push( new Weather( weathX ) );

      } );
      res.send( weatherARR );
    } );

} );

function Weather ( wData ){
  this.forecast = wData.weather.description;
  this.time = wData.valid_date;
}


server.get( '/parks',( req,res )=>{
  let cityName = req.query.search_query;
  let parksKey = process.env.PARKS_API_KEY;
  let parksUrl = `https://developer.nps.gov/api/v1/parks?q=${cityName}&limit=10&api_key=${parksKey}`;
  superagent.get( parksUrl )
    .then( parksData =>{
      let pData = parksData.body;
      let parksARR = [];
      pData.data.map( parkX =>{
        parksARR.push( new Park( parkX ) );

      } );
      res.send( parksARR );
    } );

} );


function Park ( data ) {
  this.name = data.fullName;
  this.adress = `${data.addresses[0].line1},  ${data.addresses[0].city},  ${data.addresses[0].stateCode},  ${data.addresses[0].postalCode}`;
  this.fee = data.entranceFees[0].cost;
  this.description = data.description;
  this.url = data.url;

}




server.get( '*',( req,res )=>{

  let err = {
    status: 500,
    responseText: 'Sorry, something went wrong'
  };
  res.status( 500 ).send( err );
} );


client.connect()
  .then( ()=>{

    server.listen( PORT, ()=>{
      console.log( `Listening on PORT ${PORT}` );
    } );
  } );
