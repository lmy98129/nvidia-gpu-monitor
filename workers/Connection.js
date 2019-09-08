const Client = require('ssh2').Client;
const parser = require('fast-xml-parser');

const argv = process.argv;
const { id, ...config } = JSON.parse(argv[2])

const conn = new Client();
const tag = "nvidia_smi_log"

let isStartRecording = false
let buffer = ""
let currentStream;

function stopHandler() {
  if (currentStream) currentStream.end("exit");
  process.exit();
}

function errorHandler(err) {
  if (err) {
    process.send({ action: "ERROR" });
    stopHandler();
  }
}

conn.on('ready', function () {
  conn.shell(function (err, stream) {
    currentStream = stream;
    errorHandler(err);
    
    stream.on('close', function () {
      conn.end();
    }).on('data', function (data) {

      data = data.toString();
      if (data.indexOf(`<${tag}>`) >= 0) {          
        isStartRecording = true;
      }

      if (isStartRecording) buffer += data;
      
      if (data.indexOf(`</${tag}>`) >= 0) {
        isStartRecording = false;
        let tObj = parser.getTraversalObj(buffer);
        let json = parser.convertToJson(tObj);
        process.send({ id, data: json });
        buffer = "";
      }

    });

    stream.write('nvidia-smi -q -x -l 2\n');

  });

}).on('error', (err) => {
  errorHandler(err);
  
}).connect(config);

process.on('message', (msg) => {
  let { action } = msg;
  if (msg.id != id) return;

  switch(action) {
    case "STOP": 
      stopHandler();
      break;
  }
});