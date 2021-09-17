const mongoose = require('mongoose');
const config = require('./config');


const User = require('./models/Users');
const GSMModules = require('./models/GsmModules');
const SMSMessages = require('./models/SMSMessages');
const USSDMessages = require('./models/UssdMessages');


mongoose.set('useCreateIndex', true);
mongoose.connect(config.db.url + '/' + config.db.name, {useNewUrlParser: true});

const db = mongoose.connection;

db.once('open', async () => {
    try {
        await db.dropCollection('users');
        await db.dropCollection('gsmmodules');
        await db.dropCollection('ussdmessages');
        await db.dropCollection('smsmessages');
    } catch (e) {
        console.log('Collections were not present, skipping drop...');
    }

    console.log('collection is dropped');

    const [user1, user2] = await User.create({
        username: "Vaskodegamo01",
        password: "$2a$10$kXfjaGgBwc3VIVzRdZZ8L.Jk07Xf91tJSCO.jbhFZaZ/5yTZZNlXa", //password:"123"
        token: "wY7LIx17Xx4JwffvW2MZ",
        createdAt: Date.now()
    }, {
        username: "kasyava",
        password: "$2a$10$kXfjaGgBwc3VIVzRdZZ8L.Jk07Xf91tJSCO.jbhFZaZ/5yTZZNlXa", //password:"123"
        token: "wotvENn4yfdzRztQ60nM",
        createdAt: Date.now()
    });
    console.log('Users created');

    const [module1] = await GSMModules.create({
        PhoneNumber: "+996700143612",
        ModuleAdress: 0,
        Battery: "0.60",
        QualityGSM: "2",
        createdAt: Date.now()
    });

    // const [module1, module2] = await GSMModules.create({
    //     PhoneNumber: "+996555045085",
    //     ModuleAdress: 55,
    //     Battery: "0.89",
    //     QualityGSM: "4",
    //     createdAt: Date.now()
    // }, {
    //     PhoneNumber: "+996700143612",
    //     ModuleAdress: 56,
    //     Battery: "0.60",
    //     QualityGSM: "2",
    //     createdAt: Date.now()
    // });
    console.log('GSMModules created');

    // const [sms1, sms2, sms3, sms4, sms5] = await SMSMessages.create({
    //     PhoneNumber: module1._id,
    //     PhoneNumberFrom: "+996555045085",
    //     SMSMessage: "bla bla bla",
    //     NewSMSMessageFlag: true,
    //     createdAt: Date.now()
    // }, {
    //     PhoneNumber: module2._id,
    //     PhoneNumberFrom: "+996555045085",
    //     SMSMessage: "555 or 666 or 777",
    //     NewSMSMessageFlag: false,
    //     createdAt: Date.now()
    // },{
    //     PhoneNumber: module1._id,
    //     PhoneNumberFrom: "+996772143612",
    //     SMSMessage: "free free free 44444",
    //     NewSMSMessageFlag: false,
    //     createdAt: Date.now()
    // },{
    //     PhoneNumber: module1._id,
    //     PhoneNumberFrom: "+996550143612",
    //     SMSMessage: "111111111111",
    //     NewSMSMessageFlag: true,
    //     createdAt: Date.now()
    // },{
    //     PhoneNumber: module1._id,
    //     PhoneNumberFrom: "+996700143612",
    //     SMSMessage: "my sms text 1111111111",
    //     NewSMSMessageFlag: false,
    //     createdAt: Date.now()
    // });
    // console.log('SMSMessages created');
    //
    // const [ussd1, ussd2, ussd3, ussd4, ussd5] = await USSDMessages.create({
    //     PhoneNumber: module1._id,
    //     PhoneNumberFrom: "+996555045085",
    //     USSDMessage: "bla bla bla",
    //     NewUSSDMessageFlag: true,
    //     createdAt: Date.now()
    // }, {
    //     PhoneNumber: module2._id,
    //     PhoneNumberFrom: "+996555045085",
    //     USSDMessage: "555 or 666 or 777",
    //     NewUSSDMessageFlag: false,
    //     createdAt: Date.now()
    // },{
    //     PhoneNumber: module1._id,
    //     PhoneNumberFrom: "+996555045085",
    //     USSDMessage: "free free free 44444",
    //     NewUSSDMessageFlag: false,
    //     createdAt: Date.now()
    // },{
    //     PhoneNumber: module1._id,
    //     PhoneNumberFrom: "+996555045085",
    //     USSDMessage: "111111111111",
    //     NewUSSDMessageFlag: true,
    //     createdAt: Date.now()
    // },{
    //     PhoneNumber: module1._id,
    //     PhoneNumberFrom: "+996555045085",
    //     USSDMessage: "my sms text 1111111111",
    //     NewUSSDMessageFlag: false,
    //     createdAt: Date.now()
    // });
    // console.log('USSDMessages created');

    db.close();
});
