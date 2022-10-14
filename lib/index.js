
// const net = require("net");
// const events = require("events");
// const Parser = require("./Parser");

// module.exports = class Service {

//   constructor(port, simpleData = true) {
//     this.port = port;
//     this.Parser = new Parser(simpleData);
//     this.server = net.createServer(this.socket.bind(this));
//     this.emitter = new events.EventEmitter();
//   }

//   // Start service listening
//   async start() {
//     await this.server.listen(this.port);

//     console.log('Service start listening');
//   }

//   // Stop service listetning
//   async end(callback) {
//     await this.server.close();

//     console.log('Service stoped listening');

//     return callback ? callback()
//                     : null;
//   }

//   // Concat buffer
//   concatBuffer(bufferArray) {
//     let totalLength = 0;

//     bufferArray.forEach((b) => {
//       totalLength += b.length;
//     });

//     return Buffer.concat(bufferArray, totalLength);
//   }

//   // Service data handler
//   socket(socket) {
//     let callback = function(buffer) {
//       let body;
//       let data = [];

//       if (body) {
//         body = this.concatBuffer([body, buffer]);
//       } else {
//         body = buffer;
//       }

//       while (true) {
//         let result = this.Parser.buffer(body);
//         body = result.data;

//         if (!result.message) {
//           break;
//         } else {
//           this.emitter.emit('message', result.message);
//         }
//       }

//       // To each valid incoming packet, Wialon sends 0x11 as a response.
//       socket.write(Buffer.from([0x11]));
//     }

//     socket.on("data", callback.bind(this));
//   }
// }































const net = require('net');
const msgParser = require('./msg-parser');
const events = require('events');

let bufTail;
const controllerList = {};

function concatBuf (bufArr) {
  let totalLength = 0;
  bufArr.forEach((b) => {
    totalLength += b.length;
  });
  return Buffer.concat(bufArr, totalLength);
}

module.exports = class Retranslator {
  
  constructor (options) {
    const { port } = options;
    this.emitter = new events.EventEmitter();
    this.port = port;
    this.server = net.createServer(this.socket.bind(this));
  }

  start () {
    const _this = this;
    _this.server.listen(_this.port, () => {
      console.log('server lisetning.');
    });
  }

  stop (callback) {
    this.server.close(() => {
      console.log('server closed.');
      return callback();
    });
  }

  socket (c) {
    const _this = this;

    c.on('data', function (buffer) {
      
      try{

        console.log('packet! length:', buffer.length);
        if (bufTail) {
          console.log('concatBuf: [', bufTail.length, buffer.length, ']');
          bufTail = concatBuf([bufTail, buffer]);
          console.log('concatBuf result bufTail: ', bufTail.length);
        } else {
          bufTail = buffer;
        }
        const data = [];

        while (true) {
          
          var result = msgParser.tryParseBuffer(bufTail); // propenso a error

          bufTail = result.bufferTail;
          if (!result.message) {
            break;
          } else {
            const cId = result.message.controllerId;
            if (controllerList[cId]) {
              controllerList[cId] += 1;
            } else {
              controllerList[cId] = 1;
            }
            data.push(result.message);
            _this.emitter.emit('message', result.message);
          }

        }
        // writable.write(JSON.stringify(data, null, 2), {encoding: 'utf8'});
        console.log('data.length:', data.length);
        console.log('bufTail.length: ', bufTail.length);
        console.log(JSON.stringify(controllerList, null, 2));
        console.log('----');
        c.write(new Buffer([0x11]));

      }
      catch(err){

        process.exit();
        //c.write(new Buffer([0x11]));
        console.log(err);
      }

    });



  }

}
