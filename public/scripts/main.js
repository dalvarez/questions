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
    var filterObject = {
      difficulty: [],
      topics:[]
    };

    $(event.target).toggleClass('selected');

    $('#difficulty-filter .dropdown-menu li a.selected').each(function(index){
      filterObject.difficulty.push(parseInt($(this).text() ,10));
    });
    $('#topic-filter .dropdown-menu li a.selected').each(function(index){
      filterObject.topics.push($(this).text());
    });

    if(filterObject.difficulty.length > 0 || filterObject.topics.length > 0){
      socket.emit('filter', filterObject);
      $('#clearFilters').show();
    }
    else{
      socket.emit('clearFilters');
      $('#clearFilters').hide();
    }
  });

  $('#clearFilters').on('click', function(){
    socket.emit('clearFilters');
    $('.selected').removeClass('selected');
    $('#clearFilters').hide();
  });
