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

  //clear out filters ?
  questionsDB.filters = {};
  questionsDB.filteredPages = {};

  response.render('pages/index', {questions: undefined, questionsTemplate: questionsTemplate});
}); // END of app.get '/'

questionsDB.all(app.locals.options, function(error, pages){
  console.log('All of the questions are cached.');
});

io.on('connection', function(client){
  console.log('Client connected...');
  let currentPageNumber = 1;
  // let currentPage = null;

  let sendPage = function(page, showPrevious, showNext){
    console.log('sendPage was called');
    newHTML = questionsTemplate({questions: page});
    client.emit('newPage', {questionsHTML: newHTML, showPrevious: showPrevious, showNext: showNext, fullJson: questionsDB.pages});
  };

  let getPage = function(currentPageNumber){
    questionsDB.getPage(currentPageNumber, function(data){
      sendPage(data.page, data.showPrevious, data.showNext);
    });
  };

  client.on('nextPage', function(){
    console.log('nextPage was called');
    currentPageNumber = currentPageNumber + 1;
    getPage(currentPageNumber);
  });

  client.on('previousPage', function(){
    console.log('previousPage was called');
    currentPageNumber = currentPageNumber - 1;
    getPage(currentPageNumber);
  });

  getPage(currentPageNumber);

  client.on('filter', function(filterObject){
    //add that to a questionsDB.filters objext
    questionsDB.filters = filterObject;
    console.log('questionsDB filters is now ', questionsDB.filters);
    var filtered = questionsDB.filterPages(questionsDB.filters, app.locals.options);

    questionsDB.filteredPages = filtered;
    client.emit('nowFiltered', questionsDB.filteredPages);
    //call the filtersPage
      //maybe swap pages with filtersPage?
      //this may affect all clients, so maybe store filtered on the client side
    //load page 1 by calling sendPage
    // sendPage(questionsDB.filteredPages[1], false, true);
    currentPageNumber = 1;
    getPage(currentPageNumber);
  });

  client.on('clearFilters', function(){
    questionsDB.filters = {};
    questionsDB.filteredPages = {};
    currentPageNumber = 1;
    getPage(currentPageNumber);
  });

});
