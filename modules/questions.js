"use strict";

var utils = require('./utils');
var async = require('async');
var Airtable = require('airtable');
var base = new Airtable({ apiKey: 'keyDSIKXybboB4yTY' }).base('appfeRWL1dYhKSR9E');

var questions = {
  all: function(options, done){
    options = options || {};

    var defaultOptions = {
      view: "Main View",
      maxRecords: 50,
      pageSize: 20
    };

    options = utils.extend(defaultOptions, options);
console.log('options are now ', options);
    var questions = [];
    var question;

    async.waterfall([
        function(waterfallCallback) {
          //get questions and massage the data
          // base('Questions').select(options).firstPage(function(error, records){
          base('Questions')
          .select(options)
          .eachPage(function page(records, fetchNextPage){
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

            questions.forEach(function(question){
              let choiceIds = question.choiceIds;
              for(let key in choiceIds){
                if(choiceIds.hasOwnProperty(key)){

                  let choiceKey = key;
                  asyncTasks.push(function(parallelCallback){
                    base('Choices').find(choiceIds[choiceKey], function(err, record){
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
        },
        function(questions, waterfallCallback) {
            //find all the images
            var asyncTasks = [];
            let image;

            questions.forEach(function(question){
              let imageIds = question.imageIds;
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

        }
    ], function (err, result) {
        // result now equals 'questions'
        console.log('waterfall done, results are ', result);
        done(null, result);
        // response.render('questions',{questions: result});
        //draw the panels here - we need the list of formed questions to do it
    });
  }
};

module.exports = questions;
