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
  maxRecords: 10,
  pageSize: 3
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
app.locals.currentPage = 1;

var templateFile = fs.readFileSync(__dirname + '/views/partials/questions.ejs', 'utf8');

let questionsTemplate = ejs.compile(templateFile);
let newHTML = '';

io.on('connection', function(client){
  console.log('Client connected...');

  let sendNextPage = function(){
    console.log('sending the page to the client');
    let showNextButton = app.locals.pages[app.locals.currentPage + 1] !== undefined ? true : false;
    console.log('showNextButton?', showNextButton);
    newHTML = questionsTemplate({questions: app.locals.pages[app.locals.currentPage]});
    client.emit('nextPage', {questions: newHTML, currentPage: app.locals.currentPage, showNextButton: showNextButton});
  };

  let cacheResults = function(questions, pageNumber){
    console.log('caching questions');
    app.locals.pages[pageNumber] = questions;
    if(app.locals.pages[app.locals.currentPage] !== undefined){
      console.log('grabbing next page from cache');
      sendNextPage();
    }
    if(app.locals.pages[app.locals.currentPage + 1] === undefined
    && app.locals.fetchNextPage !== null ){
      //need to pre-fetch the next page
      app.locals.fetchNextPage();
    }
    else {
      if(app.locals.currentPage === 1)
        sendNextPage();
    }
  };

  client.on('nextPage', function(){
    //need to make sure that this will be unique to each client
    app.locals.currentPage++;
    if(app.locals.pages[app.locals.currentPage + 1] === undefined
    && app.locals.fetchNextPage !== null ){
      console.log('calling fetchNextPage');
      app.locals.fetchNextPage();
    } else {
      if(app.locals.pages[app.locals.currentPage] !== undefined){
        console.log('grabbing next page from cache');
        sendNextPage();
      }
    }


  });

  client.on('previousPage', function(){
    app.locals.currentPage--;
    newHTML = questionsTemplate({questions: app.locals.pages[app.locals.currentPage]});
    client.emit('previousPage', {questions: newHTML, currentPage: app.locals.currentPage, showNextButton: true});
  });

  questionsDB.all(options, function(error, questions, pageNumber, fetchNextPage){
    console.log('questionsDB callback here');
    console.log('current page is ', app.locals.currentPage);
    if(fetchNextPage === null){
      //no more pages
      console.log('database has no more pages');
      sendNextPage();
    } else {
      //maybe do this if not null, only
      app.locals.fetchNextPage = fetchNextPage;
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
