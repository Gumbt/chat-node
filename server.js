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
let people = [];

io.on('connection', socket => {
    socket.emit('previousMessages', messages);//pega mensagens anteriores

    socket.on("join", ob => {
        if(ob.atv == 0){
            io.sockets.emit("update", ob.user + " entrou no server.");
            messages.push({author:'Server',message:ob.user + " entrou no server."});
        }
        people.push(ob.user);
    
        io.sockets.emit('onlineUsers', people);
        //io.sockets.emit('userCount', userCount);
        socket.on('disconnect', function() {
            //io.sockets.emit('userCount', userCount);
            var pos = people.indexOf(ob.user);
            if (pos >= 0)
                people.splice(pos, 1);
            io.sockets.emit('onlineUsers', people);
        });
        console.log(`Usuarios online: ${people.length}`);
        console.log(`Socket conectado: ${socket.id}`);
    });
    socket.on('comandos', data => {
        messages.push(data);
        cont=0;
        if(data.message=="/limpachat"){
            socket.emit("update", data.author + " limpou o chat.");
        }
        if(data.message=="/comandos"){
            socket.emit("update", "<br><b>/limpachat</b> - Limpa o chat<br><b>/gumb</b> - Mensagem");
        }
        if(data.message=="/gumb"){
            var msg = {author:'Server',message:"Gumb é incrivel"};
            io.sockets.emit("update", msg.message);
            messages.push(msg);
        }else{
            socket.emit("update", "Comando não encontrado, digite <b>/comandos</b> para ver os comandos");
        }

    })

    socket.on('sendMessage', data => {//manda as mensagens para todos
        messages.push(data);//pega as msg do index
        socket.broadcast.emit('receivedMessage', data);
    });
});

server.listen(process.env.PORT || 3000);