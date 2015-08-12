var config = [
  {
    'ip': '10.13.25.206',
    'code': '13104',
    'tag': '4112',
    'num': '1'
  },
  {
    'ip': '10.13.25.207',
    'code': '13104',
    'tag': '4312',
    'num': '2'
  },
  {
    'ip': '10.13.24.215',
    'code': '13106',
    'tag': '4112',
    'num': '1'
  }
];

var casper = require('casper').create();
var utils = require('./app/utils.js');
var fs = require('fs');
casper.start();

casper.each(config, function(self, link){
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
        return {
          tagObj: tagObj,
          lastItem: lastItem
        };
      });

      var tagCombineObj = {
          "Connect": true,
          "Name": link.code+'/'+link.num+'/'+link.tag,
          "CurDate": utils.getCurDate('-'),
          "CurTime": utils.minutesToHours(obj.tagObj.length-1),
          "CurVal": obj.lastItem,
          "Description": "",
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
