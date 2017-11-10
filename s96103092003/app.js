// Application Log
var log4js = require('log4js');
var log4js_extend = require('log4js-extend');
log4js_extend(log4js, {
    path: __dirname,
    format: '(@file:@line:@column)'
});
log4js.configure(__dirname + '/log4js.json');
var logger = log4js.getLogger('line');

Date.prototype.YYYYMMDD = function () {
    var mm = this.getMonth() + 1;
    var dd = this.getDate();
    return [this.getFullYear(), (mm > 9 ? '' : '0') + mm, (dd > 9 ? '' : '0') + dd].join('');
}

// 建立 express service
var express = require('express');
var app = express();
var port = process.env.PORT || 1337;
var http = require('http');
var server = http.Server(app).listen(port);
var bodyParser = require('body-parser');
var session = require('express-session');

app.use(session({//session值放內存
    secret: 'abcd',
    resave: false,
    saveUninitialized: true,
}));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

process.on('uncaughtException', function (err) {
    logger.error('uncaughtException occurred: ' + (err.stack ? err.stack : err));
});

var hashtable = require(__dirname + '/hashtable.js');

var users = new hashtable.Hashtable;


// 讀取組態表
var fs = require('fs');
var config = fs.readFileSync(__dirname + '/config.json', 'utf8');

logger.info('Config: ' + config);
config = JSON.parse(config);

var mac = 'TIM9C65F9235514';

app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    next();
});
app.use(express.static('resource'));

app.get('/api', function (request, response) {
    response.send('API is running');
});
app.get('/api/mac', function (request, response) {
    logger.info('GET /api/mac request');
    response.send(mac);
});
app.put('/api/mac', function (request, response) {
    logger.info('PUT /api/mac request');
    if (request.body.mac != undefined) {
        mac = request.body.mac;
        response.send('Modify Success');
    } else {
        response.send('Modify Failure');
    }
});
app.get('/api/reset', function (request, response) {
    logger.info('GET /api/reset request');
    users = new hashtable.Hashtable;
    response.send(JSON.stringify({ success: true }));
});

app.use(express.static('pages'));

///////////////////////////////////////////////開啟網頁

app.get('/channelWebs/airPollutioninfo/index', function (request, response) {
    logger.info('GET /channelWebs/airPollutioninfo/index request');
    request.header('Content-Type', 'text/html');
    var fs = require('fs');
    fs.readFile(__dirname + '/pages/tpe/channelwebs/airPollutioninfo/index.htm', 'utf8', function (err, data) {
        if (err) {
            this.res.send(err);
        }
        var protocol = 'http://';
        var host = this.req.get('host');
        logger.info('encrypted: ' + this.req.connection.encrypted);
        if (this.req.connection.encrypted) {
            protocol = 'https://';
        }
        data = data +
           '<script type="text/javascript"> var ServiceUrl = "' + protocol + host + '"; </script>';
        //    + '<script type="text/javascript"> var message = ' + JSON.stringify(message) + ';</script>'
        //  + '<script type="text/javascript"> var config = ' + JSON.stringify(config) + ';</script>';
        //logger.info(data);
        this.res.send(data);
    }.bind({ req: request, res: response }));

});
app.get('/channelWebs/floodControl/index', function (request, response) {
    logger.info('GET /channelWebs/floodControl/index request');
    request.header('Content-Type', 'text/html');
    var fs = require('fs');
    fs.readFile(__dirname + '/pages/tpe/channelwebs/floodControl/index.htm', 'utf8', function (err, data) {
        if (err) {
            this.res.send(err);
        }
        var protocol = 'http://';
        var host = this.req.get('host');
        logger.info('encrypted: ' + this.req.connection.encrypted);
        if (this.req.connection.encrypted) {
            protocol = 'https://';
        }
        data = data +
           '<script type="text/javascript"> var ServiceUrl = "' + protocol + host + '"; </script>';
        //    + '<script type="text/javascript"> var message = ' + JSON.stringify(message) + ';</script>'
        //  + '<script type="text/javascript"> var config = ' + JSON.stringify(config) + ';</script>';
        //logger.info(data);
        this.res.send(data);
    }.bind({ req: request, res: response }));

});
////////////////////////////////////////////////接收網頁資料

// 傳送訊息給 LINE 使用者
function SendMessage(userId, message, password, reply_token, callback) {
    if (password == 'tstiisacompanyfortatung') {
        var data = {
            'to': userId,
            'messages': [
                { 'type': 'text', 'text': message }
            ]
        };
        logger.info('傳送訊息給 ' + userId);
        /*ReplyMessage(data, config.channel_access_token, reply_token, function (ret) {
            if (!ret) {
                PostToLINE(data, config.channel_access_token, this.callback);
            } 
        });*/
        ReplyMessage(data, config.channel_access_token, reply_token, function (ret) {
            if (ret) {
                this.callback(true);
            } else {
                PostToLINE(data, config.channel_access_token, this.callback);
            }
        }.bind({ callback: callback }));
    } else {
        callback(false);
    }
}

// 傳送【選單】給 LINE 使用者
function SendButtons(userId, image_url, title, text, buttons, alt_text, password, reply_token, callback) {
    if (password == 'tstiisacompanyfortatung') {
        var data = {
            'to': userId,
            'messages': [{
                'type': 'template',
                'altText': alt_text,
                'template': {
                    'type': 'buttons',
                    'thumbnailImageUrl': image_url,
                    'title': title,
                    'text': text,
                    'actions': buttons
                }
            }]
        };
        logger.info('傳送訊息給 ' + userId);
        ReplyMessage(data, config.channel_access_token, reply_token, function (ret) {
            if (ret) {
                this.callback(true);
            } else {
                PostToLINE(data, config.channel_access_token, this.callback);
            }
        }.bind({ callback: callback }));
    } else {
        callback(false);
    }
}

// 傳送【確認】給 LINE 使用者
function SendConfirm(userId, text, buttons, alt_text, password, reply_token, callback) {
    if (password == 'tstiisacompanyfortatung') {
        var data = {
            'to': userId,
            'messages': [{
                'type': 'template',
                'altText': alt_text,
                'template': {
                    'type': 'confirm',
                    'text': text,
                    'actions': buttons
                }
            }]
        };
        logger.info('傳送訊息給 ' + userId);
        ReplyMessage(data, config.channel_access_token, reply_token, function (ret) {
            if (ret) {
                this.callback(true);
            } else {
                PostToLINE(data, config.channel_access_token, this.callback);
            }
        }.bind({ callback: callback }));
    } else {
        callback(false);
    }
}

// 傳送【可滾動選單】給 LINE 使用者
function SendCarousel(userId, columns, password, reply_token, callback) {
    if (password == 'tstiisacompanyfortatung') {
        var data = {
            'to': userId,
            'messages': [{
                'type': 'template',
                'altText': '請至行動裝置檢視訊息',
                'template': {
                    'type': 'carousel',
                    'columns': columns
                }
            }]
        };
        logger.info('傳送訊息給 ' + userId);
        ReplyMessage(data, config.channel_access_token, reply_token, function (ret) {
            if (ret) {
                this.callback(true);
            } else {
                PostToLINE(data, config.channel_access_token, this.callback);
            }
        }.bind({ callback: callback }));
    } else {
        callback(false);
    }
}

// 直接回覆訊息給 LINE 使用者
function ReplyMessage(data, channel_access_token, reply_token, callback) {
    data.replyToken = reply_token;
    logger.info(JSON.stringify(data));
    var options = {
        host: 'api.line.me',
        port: '443',
        path: '/v2/bot/message/reply',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Content-Length': Buffer.byteLength(JSON.stringify(data)),
            'Authorization': 'Bearer <' + channel_access_token + '>'
        }
    };
    var https = require('https');
    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            logger.info('Response: ' + chunk);
        });
        res.on('end', function () {
        });
        logger.info('Reply message status code: ' + res.statusCode);
        if (res.statusCode == 200) {
            logger.info('Reply message success');
            this.callback(true);
        } else {
            logger.info('Reply message failure');
            this.callback(false);
        }
    }.bind({ callback: callback }));
    req.write(JSON.stringify(data));
    req.end();
}

// 取得 LINE 使用者資訊
function GetProfile(userId, callback) {
    var https = require('https');
    var options = {
        host: 'api.line.me',
        port: '443',
        path: '/v2/bot/profile/' + userId,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer <' + config.channel_access_token + '>'
        }
    };

    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            logger.info('Response: ' + chunk);
            if (res.statusCode == 200) {
                var result = JSON.parse(chunk);
                logger.info('displayName: ' + result.displayName);
                logger.info('userId: ' + result.userId);
                logger.info('pictureUrl: ' + result.pictureUrl);
                logger.info('statusMessage: ' + result.statusMessage);
                callback(result);
            } if (res.statusCode == 401) {
                logger.info('IssueAccessToken');
                IssueAccessToken();
            }
        });
    }).end();
}

function PostToLINE(data, channel_access_token, callback) {
    logger.info(JSON.stringify(data));
    var options = {
        host: 'api.line.me',
        port: '443',
        path: '/v2/bot/message/push',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Content-Length': Buffer.byteLength(JSON.stringify(data)),
            'Authorization': 'Bearer <' + channel_access_token + '>'
        }
    };
    var https = require('https');
    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            logger.info('Response: ' + chunk);
        });
    });
    req.write(JSON.stringify(data));
    req.end();
    try {
        callback(true);
    } catch (e) { };
}

function IssueAccessToken() {
    var https = require('https');
    var options = {
        host: 'api.line.me',
        port: '443',
        path: '/v2/oauth/accessToken',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    options.form = {};
    options.form.grant_type = 'client_credentials';
    options.form.client_id = config.channel_id;
    options.form.client_secret = config.channel_secret;

    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            logger.info('Response: ' + chunk);
            if (res.statusCode == 200) {
                var result = JSON.parse(chunk);
                config.channel_access_token = result.access_token;
                var fs = require('fs');
                fs.writeFile(__dirname + '/config.json', JSON.stringify(config), function (err) {
                    if (err) {
                        logger.error(e);
                    }
                });
            }
        });
    }).end();
}

function ControlElectricPot(control) {
    try {
        var http = require('http');
        var options = {
            host: '139.223.150.68',
            port: '443',
            path: '/v1/beacon?mac=' + mac + '&' + control,
            method: 'GET'
        };

        var req = http.request(options, function (res) {
            logger.info('STATUS: ' + res.statusCode);
            logger.info('HEADERS: ' + JSON.stringify(res.headers));
            res.body = '';
            res.on('end', function () {
                try {
                    logger.info('response end');
                } catch (e) {
                    logger.error(e);
                }
            });
        });
        req.end();
    } catch (e) {
        logger.error(e);
    }
}

function GetElectricPotStatus(callback) {
    try {
        var http = require('http');
        var options = {
            host: '139.223.150.68',
            port: '443',
            path: '/v1/beaconGetStatus?mac=' + mac,
            method: 'GET'
        };

        var req = http.request(options, function (res) {
            logger.info('STATUS: ' + res.statusCode);
            logger.info('HEADERS: ' + JSON.stringify(res.headers));
            res.body = '';
            res.on('data', function (chunk) {
                logger.info('get response data');
                this.res.body = this.res.body + chunk;
            }.bind({ res: res }));
            res.on('end', function () {
                try {
                    logger.info('response end');
                    if (typeof (callback) == 'function') {
                        callback(JSON.parse(this.res.body));
                    }
                } catch (e) {
                    logger.error(e);
                }
            }.bind({ callback: this.callback, res: res }));
        }.bind({ callback: callback }));
        req.end();
    } catch (e) {
        logger.error(e);
    }
}

// 下載 LOG 檔
app.get('/download/log', function (request, response) {
    var filename = 'line.log';
    var stream = require('fs').createReadStream(__dirname + '/logs/' + filename);
    stream.pipe(response);
});

// 取得 LINE 傳送的多媒體內容(圖、影音)
app.get('/download/content/:channel_id/:message_id', function (request, response) {
    try {
        var channel_id = request.params.channel_id;
        var message_id = request.params.message_id;
        var account = accounts.get(channel_id);
        var https = require('https');
        var options = {
            host: 'api.line.me',
            port: '443',
            path: '/v2/bot/message/' + message_id + '/content',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer <' + account.channel_access_token + '>'
            }
        };

        var req = https.request(options, function (res) {
            logger.info('STATUS: ' + res.statusCode);
            logger.info('HEADERS: ' + JSON.stringify(res.headers));
            res.body = '';

            this.response.setHeader('Content-Length', res.headers['content-length']);
            this.response.setHeader('Content-Type', res.headers['content-type']);

            res.on('data', function (chunk) {
                logger.info('get response data');
                res.body = res.body + chunk;
                this.response.write(chunk);
            }.bind({ response: this.response }));
            res.on('end', function () {
                try {
                    logger.info('response end');
                    this.response.end();
                } catch (e) {
                    logger.error(e);
                }
            }.bind({ response: this.response }));
        }.bind({ response: response }));
        req.end();
    } catch (e) {
        logger.error(e);
    }
});

// 接收來自 LINE 傳送的訊息
app.post('/', function (request, response) {
    logger.info(request.body);
    try {
        var results = request.body.events;
        logger.info(JSON.stringify(results));
        logger.info('receive message count: ' + results.length);


        for (var idx = 0; idx < results.length; idx++) {
            var acct = results[idx].source.userId;
            var reply_token = results[idx].replyToken;
            logger.info('reply token: ' + results[idx].replyToken);
            logger.info('createdTime: ' + results[idx].timestamp);
            logger.info('from: ' + results[idx].source.userId);
            logger.info('type: ' + results[idx].type);
            if (results[idx].type == 'message') {

                if (results[idx].message.type == 'sticker') {
                    SendMessage(acct, 'I am still young, do not understand what you say', 'tstiisacompanyfortatung', reply_token, function (ret) {
                    });
                } else if (results[idx].message.type == 'text') {
                    if (results[idx].message.text == 'Cooking Mode') {
                        var columns = [];
                        columns[0] = {
                            'thumbnailImageUrl': 'https://electric-pot.azurewebsites.net/cooking_mode_1.jpg',
                            'title': 'Cooking Mode',
                            'text': 'Cooking Mode',
                            'actions': [
                                {
                                    'type': 'postback',
                                    'label': 'Quick Cook',
                                    'data': 'action=Quick_Cook'
                                },
                                {
                                    'type': 'postback',
                                    'label': 'Slow Cook',
                                    'data': 'action=Slow_Cook'
                                }
                            ]
                        };
                        columns[1] = {
                            'thumbnailImageUrl': 'https://electric-pot.azurewebsites.net/cooking_mode_2.jpg',
                            'title': 'Cooking Mode',
                            'text': 'Cooking Mode',
                            'actions': [
                                {
                                    'type': 'postback',
                                    'label': 'Porridge',
                                    'data': 'action=Porridge'
                                },
                                {
                                    'type': 'postback',
                                    'label': 'Stew',
                                    'data': 'action=Stew'
                                }
                            ]
                        };
                        columns[2] = {
                            'thumbnailImageUrl': 'https://electric-pot.azurewebsites.net/cooking_mode_4.jpg',
                            'title': 'Cooking Mode',
                            'text': 'Cooking Mode',
                            'actions': [
                                {
                                    'type': 'postback',
                                    'label': 'Cake',
                                    'data': 'action=Cake'
                                },
                                {
                                    'type': 'postback',
                                    'label': 'None',
                                    'data': 'action=None'
                                }
                            ]
                        };
                        columns[3] = {
                            'thumbnailImageUrl': 'https://electric-pot.azurewebsites.net/cooking_mode_3.jpg',
                            'title': 'Cooking Mode',
                            'text': 'Cooking Mode',
                            'actions': [
                                {
                                    'type': 'postback',
                                    'label': 'Heating',
                                    'data': 'action=Heating'
                                },
                                {
                                    'type': 'postback',
                                    'label': 'Warm',
                                    'data': 'action=Warm'
                                }
                            ]
                        };
                        SendCarousel(acct, columns, 'tstiisacompanyfortatung', reply_token, function (ret) { });
                    } else if (results[idx].message.text == 'Cook Now') {
                        ControlElectricPot('type=0&value=1');
                        SendMessage(acct, 'The electric pot is cooking, when the cooking is completed, the electric pot will automatically enter the mode "Warm"', 'tstiisacompanyfortatung', reply_token, function (ret) {
                        });
                        setTimeout(function () {
                            SendMessage(this.acct, 'If you want to change another Cooking Mode or stopping cooking, you can pressing the "Stop" button on the "Control Panel" below', 'tstiisacompanyfortatung', this.reply_token, function (ret) {
                            });
                        }.bind({ acct: acct, reply_token: reply_token }), 2000);
                    } else if (results[idx].message.text == 'Stop') {
                        ControlElectricPot('type=0&value=0');
                        SendMessage(acct, 'The electric pot has stopped cooking', 'tstiisacompanyfortatung', reply_token, function (ret) {
                        });
                    } else if (results[idx].message.text == 'Device Status') {
                        SendMessage(acct, 'Please wait for a moment', 'tstiisacompanyfortatung', reply_token, function (ret) {
                        });
                        GetElectricPotStatus(function (status) {
                            logger.info('data.device_status: ' + status.data.device_status);
                            logger.info('data.capability[0].status: ' + status.data.capability[0].status);
                            var _message;
                            if (status.data.device_status) {
                                _message = 'Your device is online';
                                if (status.data.capability[0].status == 0) {
                                    _message = _message + ' and not in cooking';
                                } else if (status.data.capability[0].status == 1) {
                                    _message = _message + ' and cooking';
                                }
                            } else {
                                _message = 'Your device is offline';
                            }
                            SendMessage(this.acct, _message, 'tstiisacompanyfortatung', this.reply_token, function (ret) {
                            });
                        }.bind({ acct: acct, reply_token: reply_token }));
                    } else {
                        SendMessage(acct, 'I am still young, do not understand what you say', 'tstiisacompanyfortatung', reply_token, function (ret) {
                        });
                    }
                }
            }
            else if (results[idx].type == 'postback') {
                var acct = results[idx].source.userId;
                var data = results[idx].postback.data;
                var action = data.split('=')[1];
                if (action == 'Quick_Cook') {
                    ControlElectricPot('type=1&value=0');
                    SendMessage(acct, 'Has set the cooking mode to "Quick Cook", you can start cooking by pressing the "Cook Now" button on the "Control Panel" below', 'tstiisacompanyfortatung', reply_token, function (ret) {
                    });
                } else if (action == 'Slow_Cook') {
                    ControlElectricPot('type=1&value=1');
                    SendMessage(acct, 'Has set the cooking mode to "Slow Cook", you can start cooking by pressing the "Cook Now" button on the "Control Panel" below', 'tstiisacompanyfortatung', reply_token, function (ret) {
                    });
                } else if (action == 'Porridge') {
                    ControlElectricPot('type=1&value=5');
                    SendMessage(acct, 'Has set the cooking mode to "Porridge", you can start cooking by pressing the "Cook Now" button on the "Control Panel" below', 'tstiisacompanyfortatung', reply_token, function (ret) {
                    });
                } else if (action == 'Stew') {
                    ControlElectricPot('type=1&value=6');
                    SendMessage(acct, 'Has set the cooking mode to "Stew", you can start cooking by pressing the "Cook Now" button on the "Control Panel" below', 'tstiisacompanyfortatung', reply_token, function (ret) {
                    });
                } else if (action == 'Heating') {
                    ControlElectricPot('type=1&value=4');
                    SendMessage(acct, 'Has set the cooking mode to "Heating", you can start cooking by pressing the "Cook Now" button on the "Control Panel" below', 'tstiisacompanyfortatung', reply_token, function (ret) {
                    });
                } else if (action == 'Warm') {
                    ControlElectricPot('type=0&value=2');
                    SendMessage(acct, 'The electric pot is cooking in "Warm" mode.', 'tstiisacompanyfortatung', reply_token, function (ret) {
                    });
                    setTimeout(function () {
                        SendMessage(this.acct, 'If you want to change another Cooking Mode or stopping cooking, you can pressing the "Stop" button on the "Control Panel" below', 'tstiisacompanyfortatung', this.reply_token, function (ret) {
                        });
                    }.bind({ acct: acct, reply_token: reply_token }), 2000);
                } else if (action == 'Cake') {
                    ControlElectricPot('type=1&value=3');
                    SendMessage(acct, 'Has set the cooking mode to "Cake", you can start cooking by pressing the "Cook Now" button on the "Control Panel" below', 'tstiisacompanyfortatung', reply_token, function (ret) {
                    });
                }
            }
        }
    } catch (e) {
        logger.error(e);
    }
    response.send('');
});
app.use(function (req, res, next) {
    res.status(404);
    // respond with html page
    if (req.accepts('html')) {
        res.sendfile(__dirname + '/pages/404.htm');
        return;
    }
});

logger.info('service started.');
