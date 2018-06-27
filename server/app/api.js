var express = require('express'),
  router = express.Router(),
  fs = require('fs-extra');

router.post('/api/updateSettings/', function(req, res, next) {
  var destFile = './app/stationData/settings.json';
  fs.ensureFile(destFile, function (err) {
    if(err){
      return;
    }
    fs.writeJson(destFile, req.body, function(err){
      if (err){
        console.error(err);
        res.status(500);
      }
      console.log(destFile + ' write successfull....')
      res.status(200)
        .send({
          "status": 0,
          "msg": "",
          "data": {}
        });
    });
  })
});


module.exports = router;
