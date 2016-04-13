"use strict";

// Socket IO //
  var socket = io();
  socket.on('connect', function(){
    console.log('Client: connected to server!');
  });
  socket.on('newPage', function(data){
    if(data.fullJson){
      console.log('the full JSON is ', data.fullJson);
    }

    if(data.showPrevious)
      $('.previousPageButton').show();
    else
      $('.previousPageButton').hide();

    if(data.showNext)
      $('.nextPageButton').show();
    else
      $('.nextPageButton').hide();

      $('main').html(data.questionsHTML);
  });

  $('.nextPageButton').on('click', function(){
    socket.emit('nextPage');
  });
  $('.previousPageButton').on('click', function(){
    socket.emit('previousPage');
  });


// Filters //
  $('.filter .dropdown-menu').on('click', function(event){
    //toggle selected on the current one
    //grab all selected and put into array
    //if array length >0, send them to be filtered
    $(event.target).toggleClass('selected');
    let filterObject = {
      difficulty: [],
      topics:[]
    };

    $('#difficulty-filter .dropdown-menu li a.selected').each(function(index){
      filterObject.difficulty.push(parseInt($(this).text() ,10));
    });
    $('#topic-filter .dropdown-menu li a.selected').each(function(index){
      filterObject.topics.push($(this).text());
    });

    // let selectedDifficulties = ;
    // var difficultChoice = parseInt($(this).text(), 10);
    // var filterObject = {
    //   difficulty: difficultChoice
    // };

    console.log('filterObject is now ', filterObject);
    if(filterObject.difficulty.length > 0 || filterObject.topics.length > 0)
      socket.emit('filter', filterObject);
    else
      socket.emit('clearFilters');
  });

  socket.on('nowFiltered', function(filtered){
    console.log('filtered is ', filtered);
  });
