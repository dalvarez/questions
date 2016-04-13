"use strict";

var express = require('express');
var ejs = require('ejs');
var fs = require('fs');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var sassMiddleware = require('node-sass-middleware');
var path = require('path');
let questionsDB = require('./modules/questions');
app.locals.options = {
  maxRecords: 1000,
  pageSize: 20
};
var templateFile = fs.readFileSync(__dirname + '/views/partials/questions.ejs', 'utf8');

let questionsTemplate = ejs.compile(templateFile);
let newHTML = '';

app.set('view engine', 'ejs');

app.use(sassMiddleware({
    /* Options */
    src: __dirname + "/public/styles/sass",
    dest: __dirname + "/public/styles/css",
    debug: true,
    outputStyle: 'compressed',
    prefix:  '/public/styles/css'
}));
app.use(express.static(path.join(__dirname, 'public')));

server.listen(process.env.PORT || '3000', function(){
  console.log('we\'re listening now');
});

app.get('/', function(request, response){
  console.log('initial rendering');

  response.render('pages/index', {questions: undefined, questionsTemplate: questionsTemplate});
}); // END of app.get '/'

questionsDB.all(app.locals.options, function(error, pages){
  console.log('All of the questions are cached.');
});

io.on('connection', function(client){
  console.log('Client connected...');
  let currentPageNumber = 1;
  let clientFilters =  {
      difficulty: [],
      topics: []
  };
  let clientFilteredPages = {};

  let sendPage = function(page, showPrevious, showNext){
    console.log('sendPage was called');
    newHTML = questionsTemplate({questions: page});
    client.emit('newPage', {questionsHTML: newHTML, showPrevious: showPrevious, showNext: showNext, fullJson: questionsDB.pages});
  };

  let getPage = function(currentPageNumber){
    questionsDB.getPage(clientFilteredPages, currentPageNumber, function(data){
      sendPage(data.page, data.showPrevious, data.showNext);
    });
  };

  client.on('nextPage', function(){
    console.log('nextPage was called');
    currentPageNumber = currentPageNumber + 1;
    console.log('current page number is ', currentPageNumber);
    getPage(currentPageNumber);
  });

  client.on('previousPage', function(){
    console.log('previousPage was called');
    currentPageNumber = currentPageNumber - 1;
    console.log('current page number is ', currentPageNumber);
    getPage(currentPageNumber);
  });

  getPage(currentPageNumber);

  client.on('filter', function(filterObject){
    clientFilters = filterObject;
    console.log('client filters is now ', clientFilters);
    clientFilteredPages = questionsDB.filterPages(clientFilters, app.locals.options);

    currentPageNumber = 1;
    getPage(currentPageNumber);
  });

  client.on('clearFilters', function(){
    clientFilters =  {
        difficulty: [],
        topics: []
    };
    clientFilteredPages = {};
    currentPageNumber = 1;
    getPage(currentPageNumber);
  });

});
