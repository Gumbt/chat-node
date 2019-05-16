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
let test = [];
io.on('connection', socket => {
    socket.on('pegaAnteriores', data => {   
        socket.emit('previousMessages', messages);//pega mensagens anteriores
    });
    socket.on('verificaNome', data => {
        var pos = people.indexOf(data);
        var letters = /^[A-Za-z0-9]+$/;
        if(data.match(letters)){
            if (pos >= 0)
                socket.emit('nomeVerificado', false);
            else
                socket.emit('nomeVerificado', true);
        }else{
            socket.emit('nomeVerificado', false);
        }
    });

    socket.on("join", ob => {
        if(ob.atv == 0){
            io.sockets.emit("update", ob.user + " entrou no server.");
            messages.push({author:'Server',message:ob.user + " entrou no server."});
        }
        people.push(ob.user);
        //test.push({nome:ob.user,id:socket.id});
        io.sockets.emit('onlineUsers', people);

        socket.on('disconnect', function() {//usuario sai do chat
            var pos = people.indexOf(ob.user);
            if (pos >= 0)
                people.splice(pos, 1);
            io.sockets.emit('onlineUsers', people);
        });
        /*var test2 = [...new Set(test.map(x => x.nome))];
        console.log(test2);*/
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
                socket.emit("update", "<br><span class='aut' onClick='autoComplete(this,1)'>/limpachat</span> - Limpa o chat<br><span class='aut' onClick='autoComplete(this,1)'>/gumb</span> - Mensagem para todos<br><span class='aut' onClick='autoComplete(this,1)'>/filipe</span> - Mensagem para todos<br><span class='aut' onClick='autoComplete(this,1)'>/kappa</span> - Emoticon<br><span class='aut' onClick='autoComplete(this,1)'>/voteban</span><b> < nome ></b> - Votar para banir do chat<br><span class='aut' onClick='autoComplete(this,1)'>/pm</span><b> < nome > < mensagem ></b> - enviar mensagem privada<br><span class='aut' onClick='autoComplete(this,1)'>/pedro</span> - Mensagem para todos<br>");
                break;
            case "/gumb":
                socket.broadcast.emit('receivedMessage', data);
                var msg = {author:'Server',message:"Gumb é incrivel"};
                io.sockets.emit("update", msg.message);
                cont++;
                break;
            case "/filipe":
                socket.broadcast.emit('receivedMessage', data);
                var msg = {author:'Server',message:"Filipe nunca vai bugar meu chat, pq Gumb > Filipe"};
                io.sockets.emit("update", msg.message);
                cont++;
                break;
            case "/pedro":
                socket.broadcast.emit('receivedMessage', data);
                var msg = {author:'Server',message:"<img src='https://media1.tenor.com/images/4208dd8158669dffc801dff4ac023b46/tenor.gif?itemid=9323842'/>"};
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
                    socket.emit('receivedMessage', {author: '<span style="color:blue">(PM)</span> '+ data.author,message: 'Mensagem privada enviada para <b>'+usuario+'</b>: ' + mensagem});
                    var msg = {author:'<span style="color:blue">(PM)</span> '+data.author,message:mensagem,destino:usuario};
                    io.sockets.emit("pmMessage", msg);
                }else{
                    socket.emit("update", "PM alerta: Usuário não encontrado ou mensagem invalida");
                }
                break;
            default:
                socket.emit("update", "Comando não encontrado, digite <span class='aut' onClick='autoComplete(this,1)'>/comandos</span> para ver os comandos");
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