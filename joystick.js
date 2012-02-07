var FS = require('fs');
var EventEmitter = require('events').EventEmitter;

// http://www.mjmwired.net/kernel/Documentation/input/joystick-api.txt
function parse(buffer) {
  var event = {
    time: buffer.readUInt32LE(0),
    number: buffer[7],
    value: buffer.readInt16LE(4)
  }
  if (buffer[6] & 0x80) event.init = true;
  if (buffer[6] & 0x01) event.type = "button";
  if (buffer[6] & 0x02) event.type = "axis";
  return event;
}

// Expose as a nice JavaScript API
function Joystick(id) {
  this.wrap("onOpen");
  this.wrap("onRead");
  this.id = id;
  this.buffer = new Buffer(8);
  FS.open("/dev/input/js" + id, "r", this.onOpen);
}
Joystick.prototype = Object.create(EventEmitter.prototype, {
  constructor: {value: Joystick}
});

// Register a bound version of a method and route errors
Joystick.prototype.wrap = function (name) {
  var self = this;
  var fn = this[name];
  this[name] = function (err) {
    if (err) return self.emit("error", err);
    return fn.apply(self, Array.prototype.slice.call(arguments, 1));
  };
};

Joystick.prototype.onOpen = function (fd) {
  this.fd = fd;
  this.startRead();
};

Joystick.prototype.startRead = function () {
  FS.read(this.fd, this.buffer, 0, 8, null, this.onRead);
};

Joystick.prototype.onRead = function (bytesRead) {
  var event = parse(this.buffer);
  event.id = this.id;
  this.emit(event.type, event);
  if (this.fd) this.startRead();
};

Joystick.prototype.close = function (callback) {
  FS.close(this.fd, callback);
  this.fd = undefined;
};

////////////////////////////////////////////////////////////////////////////////

// Sample usage
var js = new Joystick(0);
js.on('button', console.log);
js.on('axis', console.log);


// Close after 5 seconds
//setTimeout(function () {
//  js.close();
//}, 5000);

