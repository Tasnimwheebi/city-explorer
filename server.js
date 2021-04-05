/* eslint-disable no-redeclare */
/* eslint-disable camelcase */
/* eslint-disable no-undef */
'use strict';

const express = require( 'express' );
const server = express();

require( 'dotenv' ).config();
const cors = require( 'cors' );
server.use( cors() );

const PORT = process.env.PORT || 3000;

server.listen( PORT, ()=>{
  console.log( `Listening on PORT ${PORT}` );
} );

const superagent = require( 'superagent' );

server.get( '/',( req,res )=>{
  res.send( 'CITY EXPLORER ' );
} );

server.get( '/location',( req,res )=>{
  let cityName = req.query.city;
  let key = process.env.GEOCODE_API_KEY;
  let localURL = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
  superagent.get( localURL )
    .then( getData =>{
      console.log( getData );
      let locationData = getData.body;

      let newLocation = new Location ( cityName ,locationData );
      res.send( newLocation );
      console.log( newLocation );
      console.log( getData );

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
