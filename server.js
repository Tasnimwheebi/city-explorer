'use strict';
const express = require( 'express' );

require( 'dotenv' ).config();
const cors = require( 'cors' );
const server = express();

const PORT = process.env.PORT || 3000;

server.listen( PORT, ()=>{
  console.log( `Listening on PORT ${PORT}` );
} );

server.use( cors() );

server.get( '/location',( req,res )=>{
  let getData = require( './data/location.json' );
  let newLocation = new Location ( getData );
  res.send( newLocation );
  console.log( newLocation );
  console.log( getData );
} );

function Location( loData ){
  this.search_query ='Lynnwood';
  this.formatted_query = loData[0].display_name;
  this.latitude = loData[0].lat;
  this.longitude = loData[0].lon;

}


server.get( '/weather',( req,res )=>{
  let data = [];
  let getData = require( './data/weather.json' );
  getData.data.map( weathX =>{
    data.push( new Weather( weathX ) );
  } );
  res.send( data );
} );

function Weather ( X ){
  this.forcast = X.weather.description;
  this.time = X.valid_date;
}
// {
//     "search_query": "seattle",
//     "formatted_query": "Seattle, WA, USA",
//     "latitude": "47.606210",
//     "longitude": "-122.332071"
//   }


// server.get('/weather',(req,res)=>{
//     let getData = require('./data/weather.json');
//     let newWeather = new Weather (getData);
//     res.send(newWeather);
//     console.log(newWeather);
//     console.log(getData);
// })

// function Weather (wethData){
//     wethData.forEach()
//     this.forcast = wethData.description
// }



// [
//     {
//       "forecast": "Partly cloudy until afternoon.",
//       "time": "Mon Jan 01 2001"
//     },
//     {
//       "forecast": "Mostly cloudy in the morning.",
//       "time": "Tue Jan 02 2001"
//     },
//     ...
//   ]


server.get( '*',( req,res )=>{

  let err = {
    status: 500,
    responseText: 'Sorry, something went wrong'
  };
  res.status( 500 ).send( err );
} );
