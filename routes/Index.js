const express = require('express');
const auth = require('../middleware/auth');

const createRouter = () => {
    const router = express.Router();

    router.get('/', auth, (req, res) => {
        res.redirect('/login');
    });

    return router;
};

module.exports = createRouter;
