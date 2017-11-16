const express   = require('express');
const app       = express();
const path      = require('path');
const socket    = require('socket.io');

app.use(express.static(path.join(__dirname, 'public')));

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

const server    = app.listen(process.env.PORT, () => {
   console.log(`The server is running on: http://localhost:${process.env.PORT}`);
});

// Socket Server configuration
const io = socket(server);
let symbols = ['AAPL', 'GE'];
io.on('connection', (socket) => {
    console.log('A socket connection established');
    socket.emit('update', symbols);

    socket.on('add', (d) => {
       symbols.push(d.toUpperCase());
       io.sockets.emit('update', symbols);
    });

    socket.on('delete', (d) => {
        let i = symbols.indexOf(d.toUpperCase());
        symbols.splice(i, 1);
        io.sockets.emit('update', symbols);
    });

    socket.on('disconnect', () => {
       console.log('One socket left');
    })
});