const config = require('./config.js');
const express = require('express');
const mongoose = require('mongoose');
const simpanel = require('./routes/SimPanel');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const flash = require('connect-flash');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');
const engine = require('ejs-locals');
const GSMModules = require('./models/GsmModules');
const SMSMessages = require('./models/SMSMessages');
const USSDMessages = require('./models/UssdMessages');
const socketio = require("socket.io");
const http = require("http");

const onlineClients = new Set();

app.set('trust proxy', 1);
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(upload.array());
app.use(cookieParser());
app.use(expressSession({
    secret: 'SimHosting',
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 60000}
}));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(config.db.url + '/' + config.db.name, {useNewUrlParser: true});

const db = mongoose.connection;

db.once('open', () => {
    console.log('Mongoose connected!');
    app.use('/simpanel', simpanel());
    const server = http.createServer(app);
    const io = socketio(server);
    io.on("connection", onNewWebsocketConnection);
    server.listen(config.app.port, () => console.info(`Listening on port ${config.app.port}.`));
    setInterval(() => {
        GSMModules.aggregate([
            {
                '$lookup': {
                    'from': 'ussdmessages',
                    'let': {
                        'moduleid': '$_id',
                        'modulephonenumber': '$PhoneNumber'
                    },
                    'pipeline': [
                        {
                            '$match': {
                                '$expr': {
                                    '$and': [
                                        {
                                            '$eq': [
                                                '$$moduleid', '$PhoneNumber'
                                            ]
                                        }, {
                                            '$eq': [
                                                '$USSDMessageFlagSending', false
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    'as': 'ussd'
                }
            }, {
                '$lookup': {
                    'from': 'smsmessages',
                    'let': {
                        'moduleid': '$_id'
                    },
                    'pipeline': [
                        {
                            '$match': {
                                '$expr': {
                                    '$and': [
                                        {
                                            '$eq': [
                                                '$$moduleid', '$PhoneNumber'
                                            ]
                                        }, {
                                            '$eq': [
                                                '$SMSMessageFlagSending', false
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    'as': 'sms'
                }
            }
        ])
            .then((modules) => {

                modules.forEach((module) => {
                    if (module.ussd.length) {
                        module.ussd.forEach((ussdmessage) => {
                            io.emit("ussd", `${module.ModuleAdress},${ussdmessage.USSDMessage}`);
                            USSDMessages.findOneAndUpdate({_id: ussdmessage._id}, {USSDMessageFlagSending: true})
                                .then((answer) => {
                                    console.log("USSDMessages: ", answer);
                                })
                                .catch((error) => {
                                    console.log(error);
                                })
                        });
                    }
                    if (module.sms.length) {
                        module.sms.forEach((smsmessage) => {
                            io.emit("sms", `${module.ModuleAdress},${smsmessage.PhoneNumberTo},${smsmessage.SMSMessage}`);
                            SMSMessages.findOneAndUpdate({_id: smsmessage._id}, {SMSMessageFlagSending: true})
                                .then((answer) => {
                                    console.log("SMSMessages: ", answer);
                                })
                                .catch((error) => {
                                    console.log(error);
                                })
                        });
                    }
                });
            })
            .catch((error) => {
                console.log(error);
            })
    }, 60000);
});

function onNewWebsocketConnection(socket) {
    console.info(`Socket ${socket.id} has connected.`);
    console.log("token test: ", socket.handshake.headers);
    if (socket.handshake.headers.authorization === 'nobodyonlymypassword') {
        onlineClients.add(socket.id);

        socket.on("disconnect", () => {
            onlineClients.delete(socket.id);
            console.info(`Socket ${socket.id} has disconnected.`);
        });
        socket.on("data", (datamsg) => {
            console.info(`Socket ${socket.id} says: "${JSON.stringify(datamsg)}"`)
            let filterModuleAdress = {};
            filterModuleAdress.ModuleAdress = datamsg.module;
            if(filterModuleAdress.ModuleAdress){
                GSMModules.findOne(filterModuleAdress)
                    .then((Module) => {
                        if ((datamsg.network !== "Module not answer or same error") && (datamsg.quality !== "Module not answer or same error") && (datamsg.battery !== "Module not answer or same error")) {
                            let battery = Number(datamsg.battery.split(",")[1] / 100).toFixed(2);
                            let quality = 0;
                            if (Number(datamsg.quality) > 10 && Number(datamsg.quality) <= 15) {
                                quality = 1;
                            } else if (Number(datamsg.quality) > 15 && Number(datamsg.quality) <= 20) {
                                quality = 2;
                            } else if (Number(datamsg.quality) > 20 && Number(datamsg.quality) <= 25) {
                                quality = 3;
                            } else if (Number(datamsg.quality) > 25) {
                                quality = 4;
                            }
                            const GSMModule = {
                                SMSStatusReady: datamsg.network,
                                Battery: battery,
                                QualityGSM: quality
                            };
                            GSMModules.findOneAndUpdate({_id: Module._id}, GSMModule, {
                                new: true,
                                upsert: true
                            })
                                .then((UpdaterModule) => {
                                    console.log(UpdaterModule.toString());
                                })
                                .catch((error) => {
                                    console.log(error);
                                });
                        }
                        if (datamsg.ussd && (datamsg.ussd !== "") && (datamsg.ussd !== "NOT_USSD_RAW")) {
                            // console.log("+++++++++++ussd   ", datamsg.ussd, "   ussd+++++++++++");
                            const USSDMessage = new USSDMessages;
                            USSDMessage.PhoneNumber = Module._id;
                            USSDMessage.USSDMessage = datamsg.ussd;
                            USSDMessage.NewUSSDMessageFlag = true;
                            USSDMessage.createdAt = Date.now();
                            USSDMessage.save()
                                .then((saveanswer) => {
                                    console.log(saveanswer.toString());
                                })
                                .catch((error) => {
                                    console.log(error);
                                });
                        }
                        if (datamsg.sms && (datamsg.sms !== "") && (datamsg.sms !== "NO_SMS") && (datamsg.sms !== "Module not answer or same error")) {
                            // console.log("+++++++++++sms   ", datamsg.sms, "   sms+++++++++++");
                            let sms = datamsg.sms.split(",");
                            sms.forEach((onesms)=>{
                                const SMSMessage = new SMSMessages;
                                let smsFrom = onesms.split(":")[0];
                                let smsMessage = onesms.split(":")[1];
                                SMSMessage.PhoneNumber = Module._id;
                                SMSMessage.PhoneNumberFrom = smsFrom;
                                SMSMessage.SMSMessage = smsMessage;
                                SMSMessage.NewSMSMessageFlag = true;
                                SMSMessage.createdAt = Date.now();
                                SMSMessage.save()
                                    .then((saveanswer) => {
                                        console.log(saveanswer.toString());
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                    });
                            })
                        }

                    })
                    .catch((error) => {
                        console.log(error);
                    })
            }
        });

        GSMModules.find()
            .then((Modules) => {
                let answer = [];
                Modules.forEach((module) => {
                    answer.push(module.ModuleAdress);
                })
                answer.toString();
                socket.emit("module", answer.toString());
            })
            .catch((error) => {
                console.log(error);
            })
    }
}


