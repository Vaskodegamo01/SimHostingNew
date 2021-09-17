const net = require('net');

const server = net.createServer((c) => {
    // 'connection' listener.
    console.log('client connected');
    c.setNoDelay(true);
    c.on('end', () => {
        console.log('client disconnected');
    });
    c.pipe(c);
});

server.on('error', (err) => {
    throw err;
});
server.listen(33333, () => {
    console.log('server bound');
});