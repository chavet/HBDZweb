var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var superagent = require('superagent');
var casper = require('casper').create();

var fs = require('fs-extra');
var crawlerConfig = require('./crawlerConfig.json');


function getCurDate(sign){
  var sign = sign || '';
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();

  if(dd<10) {
    dd='0'+dd
  } 

  if(mm<10) {
    mm='0'+mm
  } 
  return yyyy+sign+mm+sign+dd;
}

function minutesToHours(minutes) { 
  var hours = leftPad(Math.floor(Math.abs(minutes) / 60));  
  var minutes = leftPad(Math.abs(minutes) % 60);  
  return hours+':'+minutes;  
}           
  
/* 
 * add zero to numbers less than 10,Eg: 2 -> 02 
 */  
function leftPad(number) {    
  return ((number < 10 && number >= 0) ? '0' : '') + number;  
} 

function crawlerSWY1(url, name) {
  console.log('crawler SWY-1'+name+'...')
  superagent.get(url)
    .end(function (err, sres) {
      if (err) {
        return console.error(err);
      }
      var destFile = './app/StationData/'+name+'.json';
      var $ = cheerio.load(sres.text);
      var items = $.html().split(' ').slice(7);
      items = items.map(function(ele){
        return ele = Number(ele);
      });
      var combineData = {
        "Connect": true,
        "Name": name.replace('/-/g', '/'),
        "CurDate": getCurDate('-'),
        "CurTime": minutesToHours(items.length-1),
        "CurVal": items[items.length-1],
        "Description": "",
        "Data": items
      };
      fs.ensureFile(destFile, function (err) {
        if(err){
          return;
        }
        fs.writeJson(destFile, combineData, function(err){
          if (err){
            console.error(err);
          }
          console.log(destFile + ' write successfull....')
        });
      })
    });
}

router.get('/crawler/WYY-1', function (req, res, next) {
  console.log('crawler WYY-1...')
  superagent.get('http://10.13.24.201/gchtoday.dat')
    .end(function (err, sres) {
      if (err) {
        return next(err);
      }
      var $ = cheerio.load(sres.text);
      var items = $.html().split(' ').slice(9),
        jsonData = {
          '9110': [],
          '9130': [],
          '9140': []
        };
      console.dir($);
      console.dir($.html());
      for(var i=0,l=items.length; i<l; i++){
        if (i%3 === 0){
          jsonData['9110'].push(items[i])
        }else if(i%3 === 1){
          jsonData['9130'].push(items[i])
        }else if(i%3 === 2){
          jsonData['9140'].push(items[i])
        }
      }
      for(var type in jsonData){
        var itemData = jsonData[type];
        var combineData = {
          "Connect": true,
          "Name": "",
          "CurDate": getCurDate('-'),
          "CurTime": minutesToHours(itemData.length),
          "CurVal": itemData[itemData.length-1],
          "Description": "",
          "Data": itemData
        };
        (function(type, combineData){
          fs.ensureFile('./app/StationData/WYY-1-'+type+'.json', function (err) {
            if(err){
              return;
            }
            fs.writeJson('./app/StationData/WYY-1-'+type+'.json', combineData, function(err){
              if (err){
                console.error(err);
              }
            });
          });
        })(type, combineData);
      }
    });
});


router.get('/crawler/test', function (req, res, next) {
  console.log('crawler test WYY-1...')
  casper.start('http://10.13.24.201/gchtoday.dat')
    .then(function(){
      console.dir(this.getHTML('body'))
    });

  casper.run(function() {
    this.echo('So the whole suite ended.');
    this.exit(); // <--- don't forget me!
  });
});



function crawler(){
  crawlerConfig.forEach(function(ele, index){
    var url = '';
    if(ele.type == 'SWY-1'){
      url = ele.url.replace('{date}', getCurDate());
      (function(url, name){
        crawlerSWY1(url, name);
      })(url, ele.name);
    }
  });
}


// crawler();

module.exports = {
  router: router,
  crawler: crawler
};