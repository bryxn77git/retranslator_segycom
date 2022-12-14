module.exports.tryParseBuffer = function tryParseBuffer(buffer) {
  if (buffer.length < 4) {
    return {
      bufferTail: buffer,
    };
  }

  var offset = 0;
  var packetSize = buffer.readUInt32LE(offset); offset += 4;
  if ((buffer.length - offset) < packetSize) {
    return {
      bufferTail: buffer,
    };
  }

  var messageBuffer = buffer.slice(offset, offset + packetSize);
  var bufferTail = buffer.slice(offset + packetSize);

  var message = parseMessage(messageBuffer);

  return {
    message: message,
    bufferTail: bufferTail,
  };
};


var ConvertBase = function (num) {
        return {
            from : function (baseFrom) {
                return {
                    to : function (baseTo) {
                        return parseInt(num, baseFrom).toString(baseTo);
                    }
                };
            }
        };
    };



function parseMessage(buf) {
  var message = {};
  var offset = 0;

  var controllerIdEnd = buf.indexOf(0x00, offset);
  var controllerIdBuf = buf.slice(offset, controllerIdEnd);
  message.controllerId = controllerIdBuf.toString();
  offset = controllerIdEnd + 1;

  var timeInSeconds = buf.readUInt32BE(offset); offset += 4;
  message.time = convertTime(timeInSeconds);

  var flags = buf.readUInt32BE(offset); offset += 4;
  message.posInfo = Boolean(flags & 0x01);
  message.digInputInfo = Boolean(flags & 0x02);
  message.digOutInfo = Boolean(flags & 0x04);
  message.alarm = Boolean(flags & 0x10);
  message.driversIdInfo = Boolean(flags & 0x20);

  message.data = parseMessageData(buf.slice(offset));

  return message;
}

function convertTime(timeInSeconds) {
  return new Date(timeInSeconds * 1000);
}

function parseMessageData(messageBuf) {
  var offset = 0;
  var data = [];
  var buf = messageBuf;

  while (true) {
    try{
    var result = tryParseDataBlock(buf);
    if (!result) {
      return data;
    }
    data.push(result.block);
    buf = result.bufTail;
    }
    catch(error){
      process.exit();
      //data = [];
      return data;
    }

  }
}

function tryParseDataBlock(buf) {
  if (buf.length === 0) {
    return false;
  }

  if (buf.length < 8) {
    throw new Error('Data block too small');
  }

  var offset = 0;

  var blockType = buf.readUInt16LE(offset); offset += 2;
  var blockSize = buf.readUInt32BE(offset); offset += 4;
  var visibility = buf.readUInt8(offset); offset += 1;
  var blockDataType = buf.readUInt8(offset); offset += 1;

  var blockNameEnd = buf.indexOf(0x00, offset);
  var blockNameBuf = buf.slice(offset, blockNameEnd);
  var blockName = blockNameBuf.toString();
  offset = blockNameEnd + 1;

  var blockValueSize = (blockSize + 6) - offset;
  var blockValueBuf = buf.slice(offset, offset + blockValueSize);
  offset += blockValueSize;

  var blockValue;



  
  if (blockName === 'posinfo') {
    blockValue = parsePosInfo(blockValueBuf);
  } else {
    switch (blockDataType) {
      case 0x01: // text
        blockValue = parseText(blockValueBuf);
		//console.log("----> " + blockName);
	//	console.log("----> " + blockValue);
	//	console.log("----> texto" );
        break;

      case 0x02: // binary
        blockValue = blockValueBuf;
        break;

      case 0x03: // Int32
        blockValue = ConvertBase(blockValueBuf.toString('hex')).from(16).to(10); //blockValueBuf.readInt32LE(0);
		//console.log("----> " + blockName);
                //console.log("----> " + blockValue);

		 //if (blockName === "gsm_signal") {
		        
			//binario
                   //     console.log(blockValueBuf);

			//for (const b of blockValueBuf) {
 			//	 console.log(b);
			//}

                        //int 32
                     //   console.log(blockValueBuf.toString('hex'));

                        //double
                        //console.log(blockValueBuf.readDoubleLE(0));

		//	console.log(ConvertBase(blockValueBuf.toString('hex')).from(16).to(10));
                 //       console.log(" ------ Fin sig -------");
		//}

               // console.log("----> enteroo" );
        break;

      case 0x04: // Double
        blockValue = blockValueBuf.readDoubleLE(0);
	// 	console.log("----> " + blockName);
        //        console.log("----> " + blockValue);
        //        console.log("----> double" );
        break;

      case 0x05: // Int64
        blockValue = ConvertBase(blockValueBuf.toString('hex')).from(16).to(10); //blockValueBuf.readIntLE(0, 8);
	//	console.log("----> " + blockName);
        //        console.log("----> " + blockValue);
        //        console.log("----> int64" );

	//	if (blockName === 'odometer') {
        		
        		//texto
			//console.log(parseText(blockValueBuf));

			//binario
          //              console.log(blockValueBuf);


			//for (const b of blockValueBuf) {
                        //         console.log(b);
                        //}


 			//int 32
            //            console.log(blockValueBuf.readInt32LE(0));

			//double
              //          console.log(blockValueBuf.readDoubleLE(0));


		//	console.log(ConvertBase(blockValueBuf.toString('hex')).from(16).to(10));
		//	console.log(" ------ Fin odo -------");
  	//	}
        break;

      default:
        throw new Error('Unknown block type code: ' + blockType);
    }
  }

  return {
    block: {
      name: blockName,
      value: blockValue,
    },
    bufTail: buf.slice(offset),
  };
}

function parsePosInfo(buf) {
  if (buf.length !== 29) {
    throw new Error('Wrong posinfo block length (' + buf.length + ')');
  }

  var offset = 0;
  var posinfo = {};

  posinfo.lon = buf.readDoubleLE(offset); offset += 8;
  posinfo.lat = buf.readDoubleLE(offset); offset += 8;
  posinfo.height = buf.readDoubleLE(offset); offset += 8;
  posinfo.speed = buf.readInt16BE(offset); offset += 2;
  posinfo.course = buf.readInt16BE(offset); offset += 2;
  posinfo.numSat = buf.readUInt8(offset); offset += 1;

  return posinfo;
}

function parseText(buf) {
  if (buf[buf.length-1] !== 0x00) {
    throw new Error('Text must end with 0x00');
  }

  var textBuf = buf.slice(0, buf.length - 1);
  var text = textBuf.toString();

  return text;
}
