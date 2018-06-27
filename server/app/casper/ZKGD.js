var config = [
  {
    'ip': '10.13.25.206',
    'stationName': '沧县冀18井',
    'code': '13104',
    'tag': '4112',
    'num': '1'
  }
  ,
  {
    'ip': '10.13.25.207',
    'stationName': '沧县冀18井',
    'code': '13104',
    'tag': '4312',
    'num': '2'
  }
  ,
  {
    'ip': '10.13.24.215',
    'stationName': '无极冀20井',
    'code': '13106',
    'tag': '4112',
    'num': '1'
  }
  // ,
  // {
  //   'ip': '10.13.25.216',
  //   'stationName': '无极冀20井',
  //   'code': '13106',
  //   'tag': '4312',
  //   'num': '2'
  // }
];

var casper = require('casper').create(
// { 
//   verbose: true,
//   logLevel: 'debug', 
//   pageSettings: {
//     userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36'
//   },
//   onError: function(self, m){//错误回调函数  
//     this.capture("error.png");  
//     console.log("onError===========================FATAL:" + m);  
//     self.exit();  
//   }
// }
);
var utils = require('./app/utils.js');
var fs = require('fs');

casper.start();

casper.each(config, function(self, link){
  var objDescription = '';

  self.thenOpen('http://'+link.ip+'/default.asp')
    .then(function(){
      this.echo(link.ip + ' start...')
    })
    .thenOpen('http://'+link.ip+'/login.asp', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: "post",
      data: {
        txtName: 'administrator',
        txtPassword: '01234567'
      }
    })
    .thenOpen('http://'+link.ip+'/Main/BatteryStatus.asp')
    .then(function(){
      //console.log(JSON.stringify('BatteryStatus...'));
      var obj = this.evaluate(function(){
          var trs = document.getElementsByTagName('tr');
          var tds_time = trs[3].getElementsByTagName('td');
          var tds_V = trs[4].getElementsByTagName('td');
          var time = tds_time[1].innerText.match(/\d+/g);
          var Description = '供电时长：'+time[0]+' 小时'+time[1]+'分钟; 蓄电池电压：'+tds_V[1].innerText;
          //__utils__.echo(JSON.stringify(Description));
          return {
            Description: Description
          };
        });
      objDescription = obj.Description;
    });

  self.thenOpen('http://'+link.ip+'/default.asp')
    .then(function(){
      this.echo(link.ip + ' start...')
    })
    .thenOpen('http://'+link.ip+'/login.asp', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: "post",
      data: {
        txtName: 'administrator',
        txtPassword: '01234567'
      }
    })
    .thenOpen('http://'+link.ip+'/Main/ReadCurrentData.asp')
    .then(function(){
      if (link.tag=='4112') {
        var obj = this.evaluate(function(){
          var trs = document.getElementsByTagName('tr'),
          tagObj = [],
          tr, lastItem;

          for (var i=4,l=trs.length; i<l; i++){
            tr = trs[i];
            tds = tr.getElementsByTagName('td');
            tagObj.push(Number(tds[1].innerText));
            if(i == (l-1)){
              lastItem = tds[1].innerText;
            }
          }
          curTime = tagObj.length-1;
          for (var i=tagObj.length,l=1440; i<l; i++){
            tagObj.push(-9999);
          }
          return {
            tagObj: tagObj,
            curTime:curTime,
            lastItem: lastItem
          };
        });
      }
      else if (link.tag=='4312') {
        var obj = this.evaluate(function(){
          var trs = document.getElementsByTagName('tr'),
          tagObj = [],
          tr, lastItem;

          for (var i=4,l=trs.length; i<l; i++){
            tr = trs[i];
            tds = tr.getElementsByTagName('td');
            tagObj.push(Number(tds[3].innerText));
            if(i == (l-1)){
              lastItem = tds[3].innerText;
            }
          }
          curTime = tagObj.length-1;
          for (var i=tagObj.length,l=1440; i<l; i++){
            tagObj.push(-9999);
          }
          return {
            tagObj: tagObj,
            curTime:curTime,
            lastItem: lastItem
          };
        });
      };
      var tagCombineObj = {
          "Connect": true,
          "Name": link.stationName + '  ' + link.code+'/'+link.num+'/'+link.tag,
          "CurDate": utils.getCurDate('-'),
          "CurTime": utils.minutesToHours(obj.curTime),
          "CurVal": obj.lastItem,
          "Description": objDescription,
          "Data": obj.tagObj
        },
        fileName = './app/stationData/'+link.code+'-'+link.num+'-'+link.tag+'.json';

      console.log('write '+fileName+' ......');
      fs.write(fileName, JSON.stringify(tagCombineObj), 'w');
  });

});


casper.run(function() {
  this.echo('ZKGD ended......');
  this.exit(); // <--- don't forget me!
});
