var config = [
  {
    'ip': '10.13.203.18',
    'code': '13024',
    'tag': ['3127', '3124', '3125'],
    'num': '1'
  },
  {
    'ip': '10.13.176.181',
    'code': '13146',
    'tag': ['3127', '3124', '3125'],
    'num': '1'
  }
];

var utils = require('./app/utils.js'); 
var fs = require('fs');
var casper = require('casper').create();

casper.start();

casper.each(config, function(self, link){
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
      var obj = this.evaluate(function(){
        var trs = document.getElementsByTagName('tr'),
          tagObj = {
            '3127': [],
            '3124': [],
            '3125': []
          },
          tr, lastItem, tds;
        console.log(trs.length)
        for (var i=1,l=trs.length; i<l; i++){
          tr = trs[i];
          tds = tr.getElementsByTagName('td');
          tagObj['3127'].push(Number(tds[1].innerText));
          tagObj['3124'].push(Number(tds[2].innerText));
          tagObj['3125'].push(Number(tds[3].innerText));
          if(i == (l-1)){
            lastItem = [tds[1].innerText, tds[2].innerText, tds[2].innerText];
          }
        }
        return {
          tagObj: tagObj,
          lastItem: lastItem
        };
      }), curTagFileName;

      for(var key in tagCombineObj){
        tagCombineObj[key] = {
          "Connect": true,
          "Name": link.code+'/'+link.num+'/'+key,
          "CurDate": utils.getCurDate('-'),
          "CurTime": utils.minutesToHours(obj.tagObj[key].length-1),
          "CurVal": obj.lastItem[link.tag.indexOf(key)],
          "Description": "",
          "Data": obj.tagObj[key]
        };
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
