"use strict";

var express = require('express');
var ejs = require('ejs');
var fs = require('fs');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var sassMiddleware = require('node-sass-middleware');
var questionsDB = require('./modules/questions');
let options = {
  maxRecords: 1000,
  pageSize: 10
};

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
app.locals.fetchNextPage = null;
app.locals.pages = {};
// app.locals.currentPage = 1;

var templateFile = fs.readFileSync(__dirname + '/views/partials/questions.ejs', 'utf8');

let questionsTemplate = ejs.compile(templateFile);
let newHTML = '';

io.on('connection', function(client){
  console.log('Client connected...');
  let currentPage = 1;
  // let pages = {};
  // let fetchNextPage = null;


  let sendNextPage = function(){
    console.log('sending the page to the client');
    let showNextButton = app.locals.pages[currentPage + 1] !== undefined ? true : false;
    console.log('showNextButton?', showNextButton);
    newHTML = questionsTemplate({questions: app.locals.pages[currentPage]});
    client.emit('nextPage', {questions: newHTML, currentPage: currentPage, showNextButton: showNextButton});
  };

  let cacheResults = function(questions, pageNumber){
    console.log('caching questions');
    app.locals.pages[pageNumber] = questions;
    if(app.locals.pages[currentPage] !== undefined){
      console.log('grabbing next page from cache');
      sendNextPage();
    }
    if(app.locals.pages[currentPage + 1] === undefined
    && app.locals.fetchNextPage !== null ){
      //need to pre-fetch the next page
      app.locals.fetchNextPage();
    }
    else {
      if(currentPage === 1)
        sendNextPage();
    }
  };

  client.on('nextPage', function(){
    //need to make sure that this will be unique to each client
    currentPage++;
    if(app.locals.pages[currentPage + 1] === undefined
    && app.locals.fetchNextPage !== null ){
      console.log('calling fetchNextPage');
      app.locals.fetchNextPage();
    } else {
      if(app.locals.pages[currentPage] !== undefined){
        console.log('grabbing next page from cache');
        sendNextPage();
      }
    }


  });

  client.on('previousPage', function(){
    currentPage--;
    newHTML = questionsTemplate({questions: app.locals.pages[currentPage]});
    client.emit('previousPage', {questions: newHTML, currentPage: currentPage, showNextButton: true});
  });

  questionsDB.all(options, function(error, questions, pageNumber, nextPageFn){
    console.log('questionsDB callback here');
    console.log('current page is ', currentPage);
    if(nextPageFn === null){
      //no more pages
      console.log('database has no more pages');
      sendNextPage();
    } else {
      //maybe do this if not null, only
      app.locals.fetchNextPage = nextPageFn;
      cacheResults(questions, pageNumber);
      // sendNextPage();
    }
  });
});
app.get('/', function(request, response){
  response.render('pages/index', {questions: undefined, questionsTemplate: questionsTemplate});
}); // END of app.get '/'


server.listen('3000', function(){
  console.log('we\'re listening now');
});
