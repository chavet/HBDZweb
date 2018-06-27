var config = [
  {
    'ip': '10.13.203.18',
    'stationName': '黄壁庄',
    'code': '13024',
    'tag': ['3127', '3124', '3125'],
    'num': '1'
  }
  ,
  {
    'ip': '10.13.176.181',
    'stationName': '新乐',
    'code': '13146',
    'tag': ['3127', '3124', '3125'],
    'num': '1'
  }
];

var utils = require('./app/utils.js'); 
var fs = require('fs');
var casper = require('casper').create({ 
  verbose: true,
  logLevel: 'debug', 
  pageSettings: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36'
  },
  onError: function(self, m){//错误回调函数  
    this.capture("error.png");  
    console.log("onError===========================FATAL:" + m);  
    self.exit();  
  }
});

casper.start();

casper.each(config, function(self, link){
  var objDescription = '';

  self.thenOpen('http://'+link.ip+'/html/index.htm', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Authorization': 'Basic MTExMTExOjExMTExMQ=='
      }
    })
    .then(function(){
      this.echo(link.ip + ' start...')
    })
    .thenOpen('http://'+link.ip+'/html/YQCS.htm', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Authorization': 'Basic MTExMTExOjExMTExMQ=='
      }
    })
    .then(function(){
      //console.log(JSON.stringify('YQCS...'));

      var obj = this.evaluate(function(){
        //__utils__.echo(JSON.stringify('Description...'));
        var trs = document.getElementsByTagName('tr'),
        Description = '',
        tr, tds;
        for (var i=1,l=trs.length; i<l; i++){
          tr = trs[i];
          tds = tr.getElementsByTagName('td');
          Description += tds[0].innerText+':'+tds[2].innerText+'; ';
        }

        return {
          Description: Description
        };
      });
      objDescription = obj.Description;
    });

  self.thenOpen('http://'+link.ip+'/html/index.htm', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Authorization': 'Basic MTExMTExOjExMTExMQ=='
      }
    })
    .then(function(){
      this.echo(link.ip + ' start...')
    })
    .thenOpen('http://'+link.ip+'/html/DTSJ.HTM', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Authorization': 'Basic MTExMTExOjExMTExMQ=='
      }
    })
    .then(function(){
      var tagCombineObj = {
        '3127': {},
        '3124': {},
        '3125': {}
      };
      var curTagObj = this.evaluate(function(){
        var trs = document.getElementsByTagName('tr'),
          tagData = {
            '3127': [],
            '3124': [],
            '3125': []
          },
          tr, lastItem, tds;

        for (var i=1,l=trs.length; i<l; i++){
          tr = trs[i];
          tds = tr.getElementsByTagName('td');
          tagData['3127'].push((tds[1].innerText == 'NULL') ? (-9999) : Number(tds[1].innerText));
          tagData['3124'].push((tds[2].innerText == 'NULL') ? (-9999) : Number(tds[2].innerText));
          tagData['3125'].push((tds[3].innerText == 'NULL') ? (-9999) : Number(tds[3].innerText));
          if(i == (l-1)){
            var ilast = i-1;
            while(tagData['3127'][ilast] == -9999 || tagData['3124'][ilast] == -9999 || tagData['3125'][ilast] == -9999)
              ilast--;
            lastItem = [tagData['3127'][ilast], tagData['3124'][ilast], tagData['3125'][ilast]];
          }
        }

        curTime = tagData['3127'].length-1;
        for (var i=tagData['3127'].length,l=1440; i<l; i++){
          tagData['3127'].push(-9999);
          tagData['3124'].push(-9999);
          tagData['3125'].push(-9999);
        }

        return {
          curTime:curTime,
          lastItem: lastItem,
          Item1: tagData['3127'],
          Item2: tagData['3124'],
          Item3: tagData['3125'],
          fullData: {}
        };
      });
      var curTagFileName;
      curTagObj.fullData = {
            '3127': curTagObj.Item1,
            '3124': curTagObj.Item2,
            '3125': curTagObj.Item3
          }

      for(var key in tagCombineObj){
        tagCombineObj[key] = {
          "Connect": true,
          "Name": link.stationName + '  ' + link.code+'/'+link.num+'/'+key,
          "CurDate": utils.getCurDate('-'),
          "CurTime": utils.minutesToHours(curTagObj.curTime),
          "CurVal": curTagObj.lastItem[link.tag.indexOf(key)],
          "Description": objDescription,
          "Data": curTagObj.fullData[key]
        };

        //console.log(JSON.stringify(tagCombineObj[key]));
        curTagFileName = './app/stationData/'+link.code+'-'+link.num+'-'+key+'.json';
        console.log('write '+curTagFileName+' ......');
        fs.write(curTagFileName, JSON.stringify(tagCombineObj[key]), 'w')
      }
    });
});

casper.run(function() {
  this.echo('FHD ended...');
  this.exit(); // <--- don't forget me!
});