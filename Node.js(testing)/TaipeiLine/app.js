// 建立 express service
var express = require('express');  // var 宣告express物件， require請求
var app = express();
var port = process.env.PORT || 8080;  //run 在8080 port上
var http = require('http');
var server = http.Server(app).listen(port);
var bodyParser = require('body-parser');  //JSON解析body的資料
app.use(bodyParser.urlencoded({  //app使用bodyParser來做解析
    extended: true
}));
app.use(bodyParser.json());
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    next();
});
app.use(express.static('pages/tpe/channelwebs/assets'));

app.get('/air_pollutioninfo', function (request, response) {
    console.log('GET /setting request (空氣盒子)');
    request.header("Content-Type", 'text/html');
    var fs = require('fs');
    fs.readFile(__dirname + '/pages/tpe/channelwebs/air_pollutioninfo/index.htm', 'utf8', function (err, data) {
        if (err) {
            this.res.send(err);
        }
        this.res.send(data);
    }.bind({ req: request, res: response }));
});
app.get('/air_pollutioninfo'+'/air_map', function (request, response) {
    console.log('GET /setting request (GoogleMap)');
    request.header("Content-Type", 'text/html');
    var fs = require('fs');
    fs.readFile(__dirname + '/pages/tpe/channelwebs/air_pollutioninfo/air_map.htm', 'utf8', function (err, data) {
        if (err) {
            this.res.send(err);
        }
        this.res.send(data);
    }.bind({ req: request, res: response }));
});
app.get('/air_pollutioninfo'+'/active_suggestion', function (request, response) {
    console.log('GET /setting request (activeSuggestion)');
    request.header("Content-Type", 'text/html');
    var fs = require('fs');
    fs.readFile(__dirname + '/pages/tpe/channelwebs/air_pollutioninfo/active_suggestion.htm', 'utf8', function (err, data) {
        if (err) {
            this.res.send(err);
        }
        this.res.send(data);
    }.bind({ req: request, res: response }));
});
app.get('/air_pollutioninfo'+'/setup_airbox_subinfo', function (request, response) {
    console.log('GET /setting request (setupAirboxSubInfo)');
    request.header("Content-Type", 'text/html');
    var fs = require('fs');
    fs.readFile(__dirname + '/pages/tpe/channelwebs/air_pollutioninfo/setup_airbox_subinfo.htm', 'utf8', function (err, data) {
        if (err) {
            this.res.send(err);
        }
        this.res.send(data);
    }.bind({ req: request, res: response }));
});
app.get('/flood_control', function (request, response) {
    console.log('GET /setting request floodControl');
    request.header("Content-Type", 'text/html');
    var fs = require('fs');
    fs.readFile(__dirname + '/pages/tpe/channelwebs/flood_control/index.htm', 'utf8', function (err, data) {
        if (err) {
            this.res.send(err);
        }
        this.res.send(data);
    }.bind({ req: request, res: response }));
});
app.get('/flood_control'+'/ncdr_text', function (request, response) {
    console.log('GET /setting request (setupAirboxSubInfo)');
    request.header("Content-Type", 'text/html');
    var fs = require('fs');
    fs.readFile(__dirname + '/pages/tpe/channelwebs/flood_control/ncdr_text.htm', 'utf8', function (err, data) {
        if (err) {
            this.res.send(err);
        }
        this.res.send(data);
    }.bind({ req: request, res: response }));
});
////////////////////////////////////////////////////////////////////////////////////////
app.use(express.static('pages/tpe'));
////////////////////////////////////////////////////////////////////////////////////////