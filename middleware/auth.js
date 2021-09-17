const config = require('../config');
const User = require('../models/Users');

const authAdmin = async (req, res, next) => {
    if(Object.keys(req.cookies).length === 0 || !req.cookies.session){
        req.flash('message', 'You are not authorized');
        return res.redirect('/simpanel/login');
    }
    const token = req.cookies.session.keys[0];
    if (!token) {
        req.flash('message', 'Your token has expired');
        return res.clearCookie("session").redirect('/simpanel/login');
    }
    const user = await User.findOne({token: token});

    if (!user) {
        req.flash('message', 'User not found');
        return res.clearCookie("session").redirect('/simpanel/login');
    }
    req.user = user;

    next();
};

module.exports = authAdmin;
