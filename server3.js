const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
// const amqp = require('amqplib');

// const fs = require('fs');
// const writable = fs.createWriteStream('file-buff.json');


app.use(express.static('public'));


const Retranslator = require('./wialon-re');
const retranslator = new Retranslator({ port: 20163 });
console.log('Retranslator console');

retranslator.emitter.on('message', msg => {
    console.log(msg)
    // console.log('Retranslator emmiter');
    // var m = JSON.stringify(msg, null, 2);

    // amqp.connect('amqp://localhost').then(
    //     function(conn) {

    //         return conn.createChannel().then(
    //             function(ch) {

    //                 var ex = 'logsT';
    //                 var ok = ch.assertExchange(ex, 'topic', { durable: false });
    //                 return ok.then(
    //                     function() {

    //                         var llave = ""; //m.includes("code") ? "meitrack" : "ruptela";
    //                         ch.publish(ex, llave, Buffer.from(m));
    //                         //ch.publish(ex, '', new Buffer(msg, 'binary'));
    //                         console.log(" [<--] Sent %s:'%s'", llave, m);
    //                         return ch.close();
    //                     });
    //             }).finally(function() {

    //             conn.close();
    //         })
    //     }).catch(console.log);

});

retranslator.start();
console.log('Start');
io.on('connection', function(socket) {

    socket.emit('msgs', eventos);

    socket.on('new-msg', function(data) {

        eventos.push(data);
        console.log(data);
        io.sockets.emit('msg', data);
    });

});


server.listen(1337, function() {
    console.log("Servidor corriendo en puerto 1337");
});