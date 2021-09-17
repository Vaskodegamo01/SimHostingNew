const express = require('express');
const User = require('../models/Users');
const GSMModules = require('../models/GsmModules');
const SMSMessages = require('../models/SMSMessages');
const USSDMessages = require('../models/UssdMessages');
const auth = require('../middleware/auth');

const createRouter = () => {
    const router = express.Router();

    router.get('/', auth, (req, res) => {
        res.redirect('/simpanel/dashboard');
    });

    router.get('/login', (req, res) => {
        res.render('template/login', {message: req.flash('message')});
    });

    router.post('/login', async (req, res) => {
        let user = await User.findOne({username: req.body.username});
        if (!user) {
            req.flash('message', 'Username not found');
            return res.redirect('/simpanel/login');
        }
        const isMatch = await user.checkPassword(req.body.password);
        if (!isMatch) {
            req.flash('message', 'Password is wrong!');
            return res.redirect('/simpanel/login');
        }
        user.token = user.generateToken();
        await user.save();
        return res.cookie('session', {
            keys: [user.token],
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true
        }).redirect('/simpanel/dashboard');
    });

    router.get('/dashboard', auth, async (req, res) => {
        let PhoneNumber = await GSMModules.find({});
        if (PhoneNumber) {
            req.flash('dashboardphone', PhoneNumber);
            res.render('template/index', {message: req.flash('message'), dashboardphone: req.flash('dashboardphone')});
        }
    });

    router.post('/dashboard', auth, async (req, res) => {

        const module = new GSMModules();
        module.PhoneNumber = req.body.phonenumber;
        module.ModuleAdress = req.body.moduleadress;
        module.createdAt = Date.now();
        try {
            await module.save();
            return res.redirect('/simpanel/dashboard');
        } catch (e) {
            console.log(e);
            req.flash('message', JSON.stringify(e));
            return res.redirect('/simpanel/dashboard');
        }
    });

    router.post('/ussd', auth, async (req, res) => {
        // console.log(req.body);
        GSMModules.findOne({PhoneNumber: req.body.ussdphonenumberfrom})
            .then(async (PhoneNumberId) => {
                // console.log(PhoneNumberId);
                const USSD = new USSDMessages();
                USSD.PhoneNumber = PhoneNumberId._id;
                USSD.PhoneNumberFrom = req.body.ussdphonenumberfrom;
                USSD.USSDMessage = req.body.ussd;
                USSD.NewUSSDMessageFlag = false;
                USSD.USSDMessageFlagSending = false;
                USSD.createdAt = Date.now();
                try {
                    await USSD.save();
                    req.flash('message', "USSD will be sent in turn");
                    return res.redirect('/simpanel/dashboard');
                } catch (e) {
                    console.log(e);
                    req.flash('message', JSON.stringify(e));
                    return res.redirect('/simpanel/dashboard');
                }
            })
            .catch((error) => {
                console.log(error);
            });
    });

    router.post('/sms', auth, async (req, res) => {
         console.log(req.body);
        GSMModules.findOne({PhoneNumber: req.body.smsphonenumberfrom})
            .then(async (PhoneNumberId) => {
                 console.log(PhoneNumberId);
                const SMS = new SMSMessages();
                SMS.PhoneNumber = PhoneNumberId._id;
                SMS.PhoneNumberFrom = req.body.smsphonenumberfrom;
                SMS.PhoneNumberTo = req.body.phonenumber;
                SMS.SMSMessage = req.body.sms;
                SMS.NewSMSMessageFlag = false;
                SMS.SMSMessageFlagSending = false;
                SMS.createdAt = Date.now();
                try {
                    await SMS.save();
                    req.flash('message', "SMS will be sent in turn");
                    return res.redirect('/simpanel/dashboard');
                } catch (e) {
                    console.log(e);
                    req.flash('message', JSON.stringify(e));
                    return res.redirect('/simpanel/dashboard');
                }
            })
            .catch((error) => {
                console.log(error);
            });
    });


    router.get('/phone', auth, (req, res) => {
        let tel = null;
        req.flash('message', '');
        req.flash('dashboardphonenumber', {
            Battery: req.query.Battery,
            PhoneNumber: req.query.PhoneNumber,
            QualityGSM: req.query.QualityGSM
        });
        GSMModules.find()
            .then((Phones) => {
                if (Phones) {
                    req.flash('dashboardphone', Object.keys(Phones).length === 0 ? "" : Phones);
                    Phones.forEach((Phone) => {
                        if (Phone.PhoneNumber == req.query.PhoneNumber) {
                            tel = Phone._id;
                        }
                    });
                    return SMSMessages.find({PhoneNumber: tel}).sort({createdAt: -1}).limit(20).populate('PhoneNumber');
                }
            })
            .then((smsmessage) => {
                if (smsmessage) {
                    req.flash('dashboardsmsmessage', Object.keys(smsmessage).length === 0 ? "" : smsmessage);
                    SMSMessages.updateMany({"NewSMSMessageFlag": true}, {"$set": {"NewSMSMessageFlag": false}})
                        .then(() => {
                            return USSDMessages.find({PhoneNumber: tel}).sort({createdAt: -1}).limit(20).populate('PhoneNumber');
                        })
                        .then((ussdmessage) => {
                            if (ussdmessage) {
                                req.flash('dashboardussdmessage', Object.keys(ussdmessage).length === 0 ? "" : ussdmessage);
                                USSDMessages.updateMany({"NewUSSDMessageFlag": true}, {"$set": {"NewUSSDMessageFlag": false}})
                                    .then(() => {
                                        res.render('template/phone', {
                                            dashboardussdmessage: req.flash('dashboardussdmessage'),
                                            dashboardsmsmessage: req.flash('dashboardsmsmessage'),
                                            message: req.flash('message'),
                                            dashboardphone: req.flash('dashboardphone'),
                                            dashboardphonenumber: req.flash('dashboardphonenumber')
                                        });
                                    });
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                }
            })
            .catch((error) => {
                console.log(error);
            });
    });


    router.get('/logout', auth, (req, res) => {
        res.clearCookie("session").redirect('/simpanel')
    });

    return router;

};

module.exports = createRouter;
