var FS = require('fs');

FS.open("/dev/input/js0", "r", function (err, fd) {
  if (err) throw err;
  var buffer = new Buffer(8);
  function startRead() {
    FS.read(fd, buffer, 0, 8, null, function (err, bytesRead) {
      if (err) throw err;
      console.log("event", buffer);
      // TODO: Parse this event
      startRead();
    });
  }
  startRead();
});
