"use strict";

var async = require('async');
var express = require('express');
var app = express();
var Airtable = require('airtable');
var base = new Airtable({ apiKey: 'keyDSIKXybboB4yTY' }).base('appfeRWL1dYhKSR9E');
app.set('view engine', 'ejs');

app.get('/', function(request, response){
  var questions = [];
  var question;

  async.waterfall([
      function(waterfallCallback) {
        //get questions and massage the data
        base('Questions').select({
          maxRecords: 10,
          view: "Main View"
        }).eachPage(function page(records, fetchNextPage){
          records.forEach(function(record) {
            question = {
              choiceIds: {},
              imageIds: {},
              choices: {}
            };
            question.text = record.get('text');
            if(record.get('choiceAID'))
              question.choiceIds.choiceA = record.get('choiceAID')[0];
            if(record.get('choiceBID'))
              question.choiceIds.choiceB = record.get('choiceBID')[0];
            if(record.get('choiceCID'))
              question.choiceIds.choiceC = record.get('choiceCID')[0];
            if(record.get('choiceDID'))
              question.choiceIds.choiceD = record.get('choiceDID')[0];
            if(record.get('choiceEID'))
              question.choiceIds.choiceE = record.get('choiceEID')[0];
            if(record.get('imageID'))
              question.imageIds.questionImageId = record.get('imageID')[0];

            questions.push(question);
          });

          fetchNextPage();
        }, function done(error){
          if(error){
            console.log('something went wrong fetching questions ', error);
            //callback(error);
          }
          waterfallCallback(null, questions);
        });
      },
      function(questions, waterfallCallback) {
          //find all the choices
          var asyncTasks = [];
          // var choiceIds, key;

          questions.forEach(function(question){
// console.log('the current question is ', question);
            let choiceIds = question.choiceIds;
            for(let key in choiceIds){
              if(choiceIds.hasOwnProperty(key)){

                let choiceKey = key;
                asyncTasks.push(function(parallelCallback){
                  base('Choices').find(choiceIds[choiceKey], function(err, record){
                    // console.log('the choiceId is ', choiceIds[choiceKey]);
                    if(record.get('text'))
                      question.choices[choiceKey] = { 'text': record.get('text') };
                    if(record.get('imageID')){
                      question.imageIds[choiceKey] = record.get('imageID')[0];
                    }
                    parallelCallback(null, 'choice captured!');
                  });
                });
              }
            }
          });

          async.parallel(asyncTasks, function(err, results) {
            waterfallCallback(null, questions);
          });

          // callback(null, questions);
      },
      function(questions, waterfallCallback) {
          //find all the images
          var asyncTasks = [];
          let image;

          questions.forEach(function(question){
            let imageIds = question.imageIds;
// console.log('imageIds are ', imageIds);
            for(var key in imageIds){
              if(imageIds.hasOwnProperty(key)){
                let imageKey = key;
                asyncTasks.push(function(parallelCallback){
                  base('Choices').find(imageIds[imageKey], function(err, record){
                    image = record.get('attachedImage')[0].url;
                    if(imageKey === "questionImageId")
                      question.image = image;
                    else
                      question.choices[imageKey]['image'] = image;

                    parallelCallback(null, 'image captured!');
                  });
                });
              }
            }
          });

          async.parallel(asyncTasks, function(err, results) {
            console.log('All images gathered.');
            waterfallCallback(null, questions);
          });

          // callback(null, questions);
      }
  ], function (err, result) {
      // result now equals 'questions'
      // console.log('waterfall done, results are ', result);
      response.render('questions',{questions: result});
      //draw the panels here - we need the list of formed questions to do it
  });

  // var questions = [];
  // var panels = [];
  // var question;
  //
  // base('Questions').select({
  //     // Selecting the first 3 records in Main View:
  //     maxRecords: 4,
  //     view: "Main View"
  // }).eachPage(function page(records, fetchNextPage) {
  //     // This function (`page`) will get called for each page of records.
  //     records.forEach(function(record) {
  //       question = {};
  //       question.text = record.get('text');
  //       question.choices = [];
  //       if(record.get('choiceAID'))
  //         question.choices.push(record.get('choiceAID'));
  //       if(record.get('choiceBID'))
  //         question.choices.push(record.get('choiceBID'));
  //       if(record.get('choiceCID'))
  //         question.choices.push(record.get('choiceCID'));
  //       if(record.get('choiceDID'))
  //         question.choices.push(record.get('choiceDID'));
  //       if(record.get('choiceEID'))
  //         question.choices.push(record.get('choiceEID'));
  //       if(record.get('imageID'))
  //         question.imageId = record.get('imageID');
  //
  //       questions.push(question);
  //     });
  //     fetchNextPage();
  // }, function done(error) {
  //     if (error) {
  //         console.log(error);
  //     }
  //
  //   ///ASYNC TEST GOES HERE
  //
  //   var asyncTasks = [];
  //   var images = [];
  //
  //   questions.forEach(function(question){
  //     asyncTasks.push(function(callback){
  //       if(question.imageId){
  //         console.log('this question has an image');
  //         base('Images').find(question.imageId, function(err, record){
  //           images.push(record.get('attachedImage')[0].url);
  //           callback('image captured!');
  //         });
  //       }
  //     });
  //   });
  //
  //   async.parallel(asyncTasks, function(err, results) {
  //     // console.log(results);
  //     console.log('all the tasks are done');
  //     console.log('there are these many images', images.length);
  //     console.log('and the image is ', images[0]);
  //     response.render('questions', {questions: questions});
  //   });
  //
  // }); // End of eachPage();

}); // END of app.get '/'

app.listen('3000', function(){
  console.log('were listening now');
});
