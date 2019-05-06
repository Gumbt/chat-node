const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use('/', (req, res) => {
    res.render('index.html');
});

let messages = [];

var userCount = 0;
io.on('connection', socket => {
    userCount++;//conta usuarios online
    socket.on('disconnect', function() {
        userCount--;
        io.sockets.emit('userCount', userCount);
    });
    io.sockets.emit('userCount', userCount);

    console.log(`Usuarios online: ${userCount}`);

    console.log(`Socket conectado: ${socket.id}`);

    socket.emit('previousMessages', messages);//pega mensagens anteriores

    socket.on('sendMessage', data => {//manda as mensagens para todos
        messages.push(data);//pega as msg do index
        socket.broadcast.emit('receivedMessage', data);
    });
});

server.listen(process.env.PORT || 3333);