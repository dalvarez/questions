"use strict";

var express = require('express');
var ejs = require('ejs');
var fs = require('fs');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var sassMiddleware = require('node-sass-middleware');
var questionsDB = require('./modules/questions');
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
let sendNextPage = null;
var templateFile = fs.readFileSync(__dirname + '/views/partials/questions.ejs', 'utf8');
// var templateFile = '<div>hi mom</div';
let questionsTemplate = ejs.compile(templateFile);
let newHTML = '';

io.on('connection', function(client){
  console.log('Client connected...');
  //Client asking for the next page
  client.on('nextPage', function(){
    //need to make sure that this will be unique to each client

    app.locals.currentPage++;
    if(app.locals.pages[app.locals.currentPage] !== undefined){
      console.log('grabbing next page from cache');
      sendNextPage();
    } else {
      console.log('calling fetchNextPage');
      app.locals.fetchNextPage();
    }
  });

  client.on('previousPage', function(){
    app.locals.currentPage--;
    newHTML = questionsTemplate({questions: app.locals.pages[app.locals.currentPage]});
    client.emit('previousPage', {questions: newHTML, currentPage: app.locals.currentPage})
  });

  sendNextPage = function(){
    console.log('sending the page to the client');
    newHTML = questionsTemplate({questions: app.locals.pages[app.locals.currentPage]});
    client.emit('nextPage', {questions: newHTML, currentPage: app.locals.currentPage});
  }

  let options = {
    maxRecords: 1000,
    pageSize: 10
  };

  questionsDB.all(options, function(error, result, fetchNextPage){
    console.log('questionsDB callback here');
    console.log('currentPage is ', app.locals.currentPage);
    app.locals.pages[app.locals.currentPage] = result;
    app.locals.fetchNextPage = fetchNextPage;
    //this assumes that socket.io is already connected...
    sendNextPage();
  });
});
app.get('/', function(request, response){
  response.render('pages/index', {questions: undefined, questionsTemplate: questionsTemplate});
}); // END of app.get '/'




server.listen('3000', function(){
  console.log('we\'re listening now');
});
