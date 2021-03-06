var config = [
  {
    'ip': '10.13.24.200',
    'stationName': '深州冀23井',
    'code': '13109',
    'tag': ['4112', '4312', '9130'],
    'num': '1'
  },
  // {
  //   'ip': '10.13.193.26',
  //   'stationName': '河间冀17井',
  //   'code': '13103',
  //   'tag': ['4112', '4312', '9130'],
  //   'num': '1'
  // },
  // {
  //   'ip': '10.13.193.58',
  //   'stationName': '黄骅冀19井',
  //   'code': '13105',
  //   'tag': ['4112', '4312', '9130'],
  //   'num': '1'
  // },
  // {
  //   'ip': '10.13.193.138',
  //   'stationName': '石家庄小马村观测站',
  //   'code': '13148',
  //   'tag': ['4112', '4312', '9130'],
  //   'num': '1'
  // }
];

var fs = require('fs');
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
casper.start();

casper.each(config, function(self, link){
  self.thenOpen('http://'+link.ip+'/datadownload.py', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: "post",
      data: {
        username: 'administrator',
        password: '01234567'
      }
    })
    .then(function(){
      var jLinks = this.evaluate(function(curDate){
        var aLinks = document.getElementsByTagName('a'),
          aLink, curHref,
          jumpedLinks = [];  //待跳转的所有url
        for (var i=4,l=aLinks.length; i<l; i++){
          aLink = aLinks[i];
          curHref = aLink.getAttribute('href');
          if (curHref.indexOf(curDate) > -1){
            jumpedLinks.push(curHref);
          }
        }
        return jumpedLinks;
      }, utils.getCurDate());

      this.each(jLinks, function(_self, jLink){
        _self.thenOpen('http://'+link.ip+jLink)
          .then(function(){
            var curTagObj = this.evaluate(function(){
              var originData = document.getElementsByTagName('pre')[0].innerText.split(' '),
                tag = originData[6],
                tagData = originData.slice(7),
                targetTagData = [],
                fullTagData = [];
              //__utils__.echo(JSON.stringify('starting...'));
              for(var i=0,l=1440; i<l; i++){
                if(tagData[i] != 'NULL'){
                  targetTagData.push(Number(tagData[i]));
                  fullTagData.push(Number(tagData[i]));
                }else{
                  fullTagData.push(-9999);
                }
              }
              curTime = targetTagData.length-1;
              curVal = targetTagData[targetTagData.length-1];
              return {
                tag: tag,
                curTime:curTime,
                curVal:curVal,
                fullData: fullTagData
              };
            });
            var combineData = {
              "Connect": true,
              "Name": link.stationName + '  ' + link.code+'/'+link.num+'/'+curTagObj.tag,
              "CurDate": utils.getCurDate('-'),
              "CurTime": utils.minutesToHours(curTagObj.curTime),
              "CurVal": curTagObj.curVal,
              "Description": "",
              "Data": curTagObj.fullData
            }, 
            fileName = './app/stationData/'+link.code+'-'+link.num+'-'+curTagObj.tag+'.json';
            console.log('write '+fileName+' ......');
            fs.write(fileName, JSON.stringify(combineData), 'w')
            // utils.writeJson('./app/stationData/'+link.code+'-'+link.num+'-'+curTagObj.tag+'.json', JSON.stringify(combineData));
          });
      }); 
    });
});

casper.run(function() {
  this.echo('SWY ended.....');
  this.exit(); // <--- don't forget me!
});
