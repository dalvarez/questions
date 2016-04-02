"use strict";

var utils = require('./utils');
var async = require('async');
var Airtable = require('airtable');
var base = new Airtable({ apiKey: 'keyDSIKXybboB4yTY' }).base('appfeRWL1dYhKSR9E');

var questions = {
  all: function(options, doneCallback){
    options = options || {};

    var defaultOptions = {
      view: "Main View",
      maxRecords: 50,
      pageSize: 20
    };

    options = utils.extend(defaultOptions, options);
        base('Questions')
        .select(options)
        .eachPage(function page(records, fetchNextPage){
          var questions = [];
          var question;
          records.forEach(function(record) {
            question = {
              choices: {}
            };
            question.text = record.get('text');
            question.difficulty = record.get('difficulty')[0];
            question.topics = record.get('topics');
            question.questionNumber = record.get('questionNumber');
            if (record.get('questionImage')) {
              question.image = record.get('questionImage')[0].url;
            }
            question.choices.choiceA = utils.extend({}, {
                text: record.get('choiceAText'),
                image: record.get('choiceAImage') ? record.get('choiceAImage')[0].url : undefined,
            });
            question.choices.choiceB = utils.extend({}, {
                text: record.get('choiceBText'),
                image: record.get('choiceBImage') ? record.get('choiceBImage')[0].url : undefined,
            });
            question.choices.choiceC = utils.extend({}, {
                text: record.get('choiceCText'),
                image: record.get('choiceCImage') ? record.get('choiceCImage')[0].url : undefined,
            });
            question.choices.choiceD = utils.extend({}, {
                text: record.get('choiceDText'),
                image: record.get('choiceDImage') ? record.get('choiceDImage')[0].url : undefined,
            });
            question.choices.choiceE = utils.extend({}, {
                text: record.get('choiceEText'),
                image: record.get('choiceEImage') ? record.get('choiceEImage')[0].url : undefined,
            });

            questions.push(question);
          });
          // waterfallCallback(null, questions, fetchNextPage);
          doneCallback(null, questions, fetchNextPage);

          // fetchNextPage();
        }, function done(error){
          if(error){
            console.log('something went wrong fetching questions ', error);
            //callback(error);
          }
            console.log('no more records');
            doneCallback(null, questions, null);
          }); //end of eachPage()

  }
};

module.exports = questions;
