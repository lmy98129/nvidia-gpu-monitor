var Client = require('ssh2').Client;
var config = require('../configs/test');
var parser = require('fast-xml-parser');

function connect() {
  var conn = new Client();
  const tag = "nvidia_smi_log"
  var isStartRecording = false
  var buffer = ""

  conn.on('ready', function () {
    console.log('Client :: ready');
    conn.shell(function (err, stream) {
      if (err) throw err;
      stream.on('close', function () {
        console.log('Stream :: close');
        conn.end();
      }).on('data', function (data) {
        data = data.toString();
        if (data.indexOf(`<${tag}>`) >= 0) {          
          isStartRecording = true;
        }

        if (isStartRecording) buffer += data;
        
        if (data.indexOf(`</${tag}>`) >= 0) {
          isStartRecording = false;
          var tObj = parser.getTraversalObj(buffer);
          var json = parser.convertToJson(tObj);
          for (let gpu of json.nvidia_smi_log.gpu) {
            if (typeof gpu.processes !== "string") {
              console.log(gpu)
              console.log(gpu.processes);
            }
          }
        }

      });
  
      stream.write('nvidia-smi -q -x\n');
      stream.end("exit\n");
    });
  
  }).connect(config);
}

const argv = process.argv;
const name = argv[2];

let t = setInterval(() => {
  process.send({ msg: `I am ${name}` });
}, 2000);

setTimeout(() => {
  clearInterval(t);
  process.exit();
}, 6100);