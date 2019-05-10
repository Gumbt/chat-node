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
    socket.on('pegaAnteriores', data => {   
        socket.emit('previousMessages', messages);//pega mensagens anteriores
    });
    socket.on('verificaNome', data => {
        var pos = people.indexOf(data);
        if (pos >= 0)
            socket.emit('nomeVerificado', false);
        else
            socket.emit('nomeVerificado', true);
    });

    socket.on("join", ob => {
        if(ob.atv == 0){
            io.sockets.emit("update", ob.user + " entrou no server.");
            messages.push({author:'Server',message:ob.user + " entrou no server."});
        }
        people.push(ob.user);
    
        io.sockets.emit('onlineUsers', people);

        socket.on('disconnect', function() {//usuario sai do chat
            var pos = people.indexOf(ob.user);
            if (pos >= 0)
                people.splice(pos, 1);
            io.sockets.emit('onlineUsers', people);
        });
        console.log(`Usuarios online: ${people.length}`);
        console.log(`Socket conectado: ${socket.id}`);
    });
    socket.on('comandos', data => {
        cont=0;

        switch(data.message.split(" ")[0]) {
            case "/limpachat":
                socket.emit("update", "você limpou o chat.");
                break;
            case "/comandos":
                socket.emit("update", "<br><b>/limpachat</b> - Limpa o chat<br><b>/gumb</b> - Mensagem para todos<br><b>/kappa</b> - Emoticon<br><b>/voteban < nome ></b> - Votar para banir do chat<br><b>/pm < nome > < mensagem ></b> - enviar mensagem privada");
                break;
            case "/gumb":
                socket.broadcast.emit('receivedMessage', data);
                var msg = {author:'Server',message:"Gumb é incrivel"};
                io.sockets.emit("update", msg.message);
                cont++;
                break;
            case "/kappa":
                socket.broadcast.emit('receivedMessage', data);
                var msg = {author:'Server',message:"<img src='https://media.alienwarearena.com/media/A-post-about-the-us-that-isn-t-about-how-it-s-_11edacc56cb159b0f8616adc7524e4f7.png' width='80'/>"};
                io.sockets.emit("update", msg.message);
                cont++;
                break;
            case "/voteban":
                var usuarioban = data.message.split(" ")[1];
                var pos = people.indexOf(usuarioban);
                if (pos >= 0){
                    socket.broadcast.emit('receivedMessage', data);
                    var msg = {author:'Server',message:"<b>"+data.author + "</b> votou para banir <b>"+ usuarioban +"</b>"};
                    io.sockets.emit("update", msg.message);
                    cont++;
                }else{
                    socket.emit("update", "Voteban alerta: Usuário não encontrado");
                }
                break;     
            case "/pm":
                var messageSplited = data.message.split(" ")
                var usuario = messageSplited[1];
                var mensagem = messageSplited.slice(2,messageSplited.length).join(" ");
                
                var pos = people.indexOf(usuario);
                if (pos >= 0 && mensagem != ''){
                    socket.emit('receivedMessage', {author: '<span style="color:blue">(PM)</span>',message: 'Mensagem privada enviada para <b>'+usuario+'</b>: ' + mensagem});
                    var msg = {author:'<span style="color:blue">(PM)</span> '+data.author,message:mensagem,destino:usuario};
                    io.sockets.emit("pmMessage", msg);
                }else{
                    socket.emit("update", "PM alerta: Usuário não encontrado ou mensagem invalida");
                }
                break;
            default:
                socket.emit("update", "Comando não encontrado, digite <b>/comandos</b> para ver os comandos");
        }
        if(cont>0){
            messages.push(data);
            messages.push(msg);
        }
    });

    socket.on('sendMessage', data => {//manda as mensagens para todos
        messages.push(data);//pega as msg do index
        socket.broadcast.emit('receivedMessage', data);
    });
});

server.listen(process.env.PORT || 3000);