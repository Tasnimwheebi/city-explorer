/* eslint-disable no-redeclare */
/* eslint-disable camelcase */
/* eslint-disable quotes */
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

// const client = new pg.Client( process.env.DATABASE_URL ); //for local testing

const client = new pg.Client ( {
  connectionString:process.env.DATABASE_URL,
  ssl:{rejectUnauthorized:false}
} );

const superagent = require( 'superagent' );

server.get( '/', ( req, res ) => {
  res.send( 'CITY EXPLORER ' );
} );

server.get( '/location', ( req, res ) => {
  let cityName = req.query.city;
  let key = process.env.GEOCODE_API_KEY;
  let localURL = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
  // get data from database
  superagent.get( localURL )
    .then( getData => {
      console.log( getData );
      let locationData = getData.body;
      let newLocation = new Location( cityName, locationData );
      let SQL = `SELECT * FROM locations Where search_query=$1;`;
      let data = [cityName];
      client.query( SQL, data )
        .then( result => {
          // check if it is  existed in database (send the response)
          if ( result.rowCount ) {

            res.send( result.rows[0] );
            console.log( result.rows[0] );
          }
          // if it is not existed send request to API server
          else {
            let search_query = newLocation.search_query;
            let formatted_query = newLocation.formatted_query;
            let latitude = newLocation.latitude;
            let longitude = newLocation.longitude;
            res.send( newLocation );
            console.log( newLocation );
            console.log( getData );
            SQL = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *;`;
            let safeValues = [search_query, formatted_query, latitude, longitude];
            client.query( SQL, safeValues )
              .then( result => {
                // res.send('Your data was successfuly!');
                res.send( result.rows[0] );
              } );
          }
        } )
        .catch( error => {
          res.send( error );
        } );
    } );
} );

server.get( '/locationtable', ( req, res ) => {
  let SQL = `SELECT * FROM locations;`;
  client.query( SQL )
    .then ( result=>{
      res.send( result.rows );
    } )
    .catch( error=>{
      res.send( error );
    } );
} );

function Location( cityName, loData ) {
  this.search_query = cityName;
  this.formatted_query = loData[0].display_name;
  this.latitude = loData[0].lat;
  this.longitude = loData[0].lon;

}


server.get( '/weather', ( req, res ) => {
  let cityName = req.query.search_query;
  let weatherKey = process.env.WEATHER_API_KEY;
  let weatherUrl = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${weatherKey}`;
  superagent.get( weatherUrl )
    .then( weatherData => {
      let wData = weatherData.body;
      let weatherARR = [];
      wData.data.map( weathX => {
        weatherARR.push( new Weather( weathX ) );

      } );
      res.send( weatherARR );
    } );

} );

function Weather( wData ) {
  this.forecast = wData.weather.description;
  this.time = wData.valid_date;
}


server.get( '/parks', ( req, res ) => {
  let cityName = req.query.search_query;
  let parksKey = process.env.PARKS_API_KEY;
  let parksUrl = `https://developer.nps.gov/api/v1/parks?q=${cityName}&limit=10&api_key=${parksKey}`;
  superagent.get( parksUrl )
    .then( parksData => {
      let pData = parksData.body;
      let parksARR = [];
      pData.data.map( parkX => {
        parksARR.push( new Park( parkX ) );

      } );
      res.send( parksARR );
    } );

} );


function Park( data ) {
  this.name = data.fullName;
  this.adress = `${data.addresses[0].line1},  ${data.addresses[0].city},  ${data.addresses[0].stateCode},  ${data.addresses[0].postalCode}`;
  this.fee = data.entranceFees[0].cost;
  this.description = data.description;
  this.url = data.url;

}


server.get( '/movies',( req,res )=>{
  let cityName = req.query.search_query;
  let keyMovie = process.env.MOVIE_API_KEY;
  let movieUrl = `https://api.themoviedb.org/3/search/movie?api_key=${keyMovie}&query=${cityName}`;
  superagent.get( movieUrl )
    .then( movieData => {
      let mData = movieData.body.results;
      let movieARR = [];
      mData.map( dataM => {
        movieARR.push( new Movie ( dataM ) );

      } );
      res.send( movieARR );
    } );
} );

function Movie ( data ) {
  this.title = data.original_title;
  this.overview = data.overview;
  this.average_votes = data.average_votes;
  this.total_votes = data.total_votes;
  this.image_url = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  this.popularity = data.popularity;
  this.released_on = data.released_on;

}
function Yelp (dataYelp){
this.name = dataYelp.name;
this.image_url = dataYelp.image_url;
this.price = dataYelp.price;
this.rating = dataYelp.rating;
this.url = dataYelp.url;
}


server.get('/yelp' ,(req,res)=>{
let cityName = req.query.search_query;
let key = process.env.YELP_API_KEY;
let pageNumbers=5;
    let page=req.query.page;
const start=((page-1)* pageNumbers +1);
    let URL=`https://api.yelp.com/v3/businesses/search?location=${cityName}&limit=${pageNumbers}&offset=${start}`;
  superagent.get(URL)
    .set('Authorization', `Bearer ${key}`)
    .then(result=>{
      let yelpArr = result.body.businesses.map((val)=>{
        let newYelp = new Yelp (val);
        return newYelp;
      });
     res.send(yelpArr);

});
});

server.get( '*', ( req, res ) => {

  let err = {
    status: 500,
    responseText: 'Sorry, something went wrong'
  };
  res.status( 500 ).send( err );
} );


client.connect()
  .then( () => {

    server.listen( PORT, () => {
      console.log( `Listening on PORT ${PORT}` );
    } );
  } );
