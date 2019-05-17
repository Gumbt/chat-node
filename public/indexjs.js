if($.cookie("nome")){
    var user = atob($.cookie("nome"));
    var atv = $.cookie("atv");
    
    var socket = io('http://localhost:3000');
    //var socket = io('https://chat-gumb.herokuapp.com/');
    
    if(!($.cookie("atv"))){
        $.cookie("atv",0);
        window.location = "/";
    }
    socket.emit("join", {user,atv});
    if(atv==0){
        var date = new Date();
        var minutes = 5;
        date.setTime(date.getTime() + (minutes * 60 * 1000));
        $.cookie("atv", 1, { expires: date });
    }
    function scrollBottom(){
        var wtf = $('.messages');
        var height = wtf[0].scrollHeight;
        wtf.scrollTop(height);
    }
    
    function renderMessage(message){
        var cm = (message.message[0]=='/')? ' comando' : '' ; //verifica se a msg é um comando
        var voce = (atob($.cookie("nome")) == message.author)? ' you' : '' ; //verifica se a msg foi enviada pelo usuario
        if(message.author=='Server')
            $('.messages').append('<div class="message Sv"><span class="nameauthor" onClick="autoComplete(this,0)">' + message.author.replace(/<script/gm, '') + '</span>: ' + message.message.replace(/<script/gm, '') + '</div>');
        else
            $('.messages').append('<div class="message'+cm+voce+'"><span class="nameauthor" onClick="autoComplete(this,0)">' + message.author.replace(/<script/gm, '') + '</span>: ' + message.message.replace(/<script/gm, '') + '<div class="hora">'+message.hora+'</div></div>');
        scrollBottom();
    }
    function renderOnlineUsers(nome){
        $('.onlineInside').append('<div class="usersOnline" onClick="autoComplete(this,0);"><span>' + nome +'</span></div>');
    }

    function carregarAnteriores(){
        $('.message').remove();
        $('.anteriores').hide();
        socket.emit('pegaAnteriores',1);
    }
    function autoComplete(b, com){
        if(com==0){
            if(b.textContent!="Server"){
                $('input[name=message]').val("/pm "+b.textContent.replace('(PM) ', '')+" ");
                $('input[name=message]').focus();
            }
        }else{
            $('input[name=message]').val(b.textContent);
            $('input[name=message]').focus();
        }
    }

    socket.on('nomeNegado', function(bool){
        if(bool==true){
            alert("Nada de muda cookie ou tenta buga o chat arrombado");
            $.removeCookie('nome');
            $.removeCookie('atv');
            window.location = "./login.html";
        }
    });

    socket.on('previousMessages', function(messages){
        for (message of messages){
            renderMessage(message);
        }
    });

    socket.on('onlineUsers', function(usero){
        let unique = [...new Set(usero)];
        $('.online span').text(unique.length);
        $('.usersOnline').remove();
        for(let i=0;i<unique.length;i++){
            renderOnlineUsers(unique[i]);
        }
    });

    socket.on('receivedMessage', function(message){
        renderMessage(message);
    });
    socket.on('pmMessage', function(message){
        if(user==message.destino)
            renderMessage(message);
    });

    socket.on("update", function(msg) {
        renderMessage({author:'Server',message:msg});
    })

    $('#chat').submit(function(event){
        event.preventDefault();
        if(atob($.cookie("nome"))!=user){
            window.location = "./login.html";
        }
        var author = atob($.cookie("nome"));
        var message = $('input[name=message]').val();
        var date = new Date();
        var hora    = date.getHours(); 
        var min     = date.getMinutes();
        if(min<10){min='0'+min}
        var str_hora = hora + ':' + min;
        if(author.length && message.length){
            var messageObject = {
                author: author,
                message: message,
                hora: str_hora
            };
            if(messageObject.message[0]=="/"){//verifica se a mensagem é um comando
                if(messageObject.message=="/limpachat"){
                    $('.message').remove();
                    $('.messages').append('<div class="message anteriores" onClick="carregarAnteriores();">Clique aqui para carregar mensagens anteriores</div>');
                }
                renderMessage(messageObject);
                socket.emit('cm', messageObject);
            }else{
                renderMessage(messageObject);
                socket.emit('sm', messageObject);
            }
        }
        $('input[name=message]').val("");
        $('input[name=message]').focus();
    });
    $('.sair').click(function(){
        $.removeCookie('nome');
        $.removeCookie('atv');
        window.location = "./login.html";
    });
}else{
    window.location = "./login.html";
}