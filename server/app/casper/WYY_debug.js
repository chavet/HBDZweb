var config = [
  {
    'ip': '10.13.24.201',
    'stationName': '深州冀23井',
    'code': '13109',
    'tag': ['9110', '9130', '9140'],
    'num': '3'
  },
  {
    'ip': '10.13.25.205',
    'stationName': '沧县冀18井',
    'code': '13104',
    'tag': ['9110', '9130', '9140'],
    'num': '3'
  }
  // ,
  // {
  //   'ip': '10.13.25.219',
  //   'stationName': '无极冀20井',
  //   'code': '13106',
  //   'tag': ['9110', '9130', '9140'],
  //   'num': '3'
  // }
];
var fs = require('fs');
var utils = require('./app/utils.js')
var casper = require('casper').create({ 
  timeout: 20*60*1000,
  verbose: true,
  logLevel: 'debug', 
  pageSettings: {   
    loadPlugins: true
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

  self.thenOpen('http://'+link.ip+'/')
    .then(function(){
      this.echo(link.ip + ' start...')
    })
    .thenOpen('http://'+link.ip+'/validate.html?UserName=administrator&Password=01234567&Submit=%B5%C7%C2%BC')
    .thenOpen('http://'+link.ip+'/mainpage.html')
    .thenOpen('http://'+link.ip+'/mainpage.html')
    .thenOpen('http://'+link.ip+'/mainpage.html')
    .then(function(){
      var obj = this.evaluate(function(){
        var trs = document.getElementsByTagName('tr');
        var tds_Val = trs[1].getElementsByTagName('td');
        var Description = '直流电压 :'+tds_Val[3].innerText
        + '; 校准电压 :'+tds_Val[4].innerText;

        __utils__.echo(JSON.stringify(Description));
        return {
          Description: Description
        };
      });
      objDescription = obj.Description;
    });

  self.thenOpen('http://'+link.ip+'/')
    .then(function(){
      this.echo(link.ip + ' start...')
    })
    .thenOpen('http://'+link.ip+'/validate.html?UserName=administrator&Password=01234567&Submit=%B5%C7%C2%BC')
    .thenOpen('http://'+link.ip+'/mainpage.html')
    .thenOpen('http://'+link.ip+'/mainpage.html')
    .thenClick('a[href="gchdata.html"]')
    .thenOpen('http://'+link.ip+'/gchtoday.dat')
    .thenOpen('http://'+link.ip+'/gchtoday.dat')
    .then(function(){
      var tagCombineObj = {
        '9110': {},
        '9130': {},
        '9140': {}
      };
      var obj = this.evaluate(function(){
        var originData = document.getElementsByTagName('pre')[0].innerText.split(' '),
          tagData = originData.slice(9),
          tagObj = {
            '9110': [],
            '9130': [],
            '9140': []
          },
          fullTagObj = {
            '9110': [],
            '9130': [],
            '9140': []
          }, lastItem;
        function _str2Num(str){
          num = 0
          if (str != 'NULL'){
            num = Number(str);
          }
          return num;
        }
		//__utils__.echo('starting...');
        for (var i=3,l=tagData.length; i<l; i+=3){
		  //__utils__.echo(JSON.stringify(i));
          tagObj['9110'].push(_str2Num(tagData[i]));
          tagObj['9130'].push(_str2Num(tagData[i+1]));
          tagObj['9140'].push(_str2Num(tagData[i+2]));
          if(i == (l-3)){
            lastItem = [_str2Num(tagData[i]), _str2Num(tagData[i+1]), _str2Num(tagData[i+2])];	//tagData[i+2]
          }
        }
        curTime = tagObj['9110'].length-1;
        for (var i=tagObj['9110'].length,l=1440; i<l; i++){
          tagObj['9110'].push(-9999);
          tagObj['9130'].push(-9999);
          tagObj['9140'].push(-9999);
        }
        return {
          tagObj: tagObj,
          curTime:curTime,
          lastItem: lastItem
        };
      }), curTagFileName;

      //console.log(JSON.stringify(obj.tagObj));
      console.log(JSON.stringify(objDescription));
      for(var key in tagCombineObj){
        tagCombineObj[key] = {
          "Connect": true,
          "Name": link.stationName + '  ' + link.code+'/'+link.num+'/'+key,
          "CurDate": utils.getCurDate('-'),
          "CurTime": utils.minutesToHours(obj.curTime),
          "CurVal": obj.lastItem[link.tag.indexOf(key)],
          "Description": objDescription,
          "Data": obj.tagObj[key]
        };
        curTagFileName = './app/stationData/'+link.code+'-'+link.num+'-'+key+'.json';
        console.log('write '+curTagFileName+' ......');
        fs.write(curTagFileName, JSON.stringify(tagCombineObj[key]), 'w')
      }
    });
});


casper.run(function() {
  this.echo('WYY ended.......');
  this.exit(); // <--- don't forget me!
});