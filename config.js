const rootPath = __dirname;

module.exports = {
    rootPath,
    db: {
        url: 'mongodb://localhost:27017',
        name: 'simhosting'
    },
    board: {
        host: '127.0.0.1',//'192.168.1.55',
        port: 33333
    },
    app: {
        port: 3000
    }
};
