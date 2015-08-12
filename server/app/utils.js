var file = require('./app/file.js');

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


module.exports = {
  getCurDate: getCurDate,
  minutesToHours: minutesToHours
};