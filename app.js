"use strict";

var async = require('async');
var express = require('express');
var app = express();
var sassMiddleware = require('node-sass-middleware');
var Airtable = require('airtable');
var base = new Airtable({ apiKey: 'keyDSIKXybboB4yTY' }).base('appfeRWL1dYhKSR9E');
var questions = require('./modules/questions');
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(sassMiddleware({
    /* Options */
    src: __dirname + "/public/styles/sass",
    dest: __dirname + "/public/styles/css",
    // debug: true,
    outputStyle: 'compressed',
    prefix:  '/public/styles/css'
}));

app.get('/', function(request, response){

  var options = {
    filterByFormula: 'difficulty = 3',
    maxRecords: 5
  };
  questions.all(options, function(error, result){
    console.log('caller with the done: ');
    response.render('pages/index',{questions: result});

  });

}); // END of app.get '/'

app.listen('3000', function(){
  console.log('we\'re listening now');
});
