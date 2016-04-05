"use strict";

var utils = require('./utils');
var Airtable = require('airtable');
var base = new Airtable({ apiKey: 'keyDSIKXybboB4yTY' }).base('appfeRWL1dYhKSR9E');
let pageNumber = 0;

var questions = {
  pages: {},

  getPage: function(number, callback){
    console.log('getPage was called');
    let that = this;
    let data = {};
    if(that.pages[number] !== undefined){
      data.page = that.pages[number];
    }
    data.showNext = that.pages[number + 1] !== undefined;
    data.showPrevious = that.pages[number - 1] !== undefined;
    callback(data);
  },

  all: function(options, doneCallback){
    let that = this;
    let pages = this.pages;

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
      pageNumber++;
      records.forEach(function(record) {
        question = {
          choices: {}
        };
        question.text = record.get('text');
        if(record.get('difficulty')){
          question.difficulty = record.get('difficulty')[0];
        }
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
      console.log('questions for page '+pageNumber+' gotten. caching and storing fetch');
      //cache the pages at this level
      pages[pageNumber] = questions;

      fetchNextPage();
    }, function done(error){
      if(error){
        console.log('something went wrong fetching questions ', error);
        //callback(error);
      }
        console.log('no more records to fetch');
        doneCallback(null, pages);
      }); //end of eachPage()

  }
};

module.exports = questions;
