const express   = require('express');
const app       = express();
const path      = require('path');
const socket    = require('socket.io');

app.use(express.static(path.join(__dirname, 'public')));

const server    = app.listen(process.env.PORT, () => {
   console.log(`The server is running on: http://localhost:${process.env.PORT}`);
});

// Socket Server configuration
const io = socket(server);
io.on('connection', (socket) => {
   console.log('A socket connection established');

   socket.on('disconnect', () => {
       console.log('One socket left');
   })
});