$(document).ready(function(){
    var socket = io('http://localhost:3000');
    //var socket = io('https://chat-gumb.herokuapp.com/');
    if($.cookie("nome")){
        window.location = "/";
    }
    $(".formLogin").submit(function(e){
        e.preventDefault();
        var nome = $(".user").val();
        var letters = /^[A-Za-z0-9]+$/;
        if(nome.match(letters)){
            socket.emit("verificaNome", nome);
            socket.on("nomeVerificado", function(boolean) {
                if(boolean==true && nome !='Server'){
                    $.cookie("nome", btoa(nome), { expires: 3 });
                    $.cookie("atv", 0, { expires: 3 });
                    window.location = "/";
                }else{
                    alert('Já existe um usuário online com o seu nome ou voce ta tentando faze merda no chat');
                }
            });
        }else{
            alert('Nome assim não pode parça');
        }
    });
});