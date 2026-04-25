const fs = require('fs');
const Pbf = require('pbf').default;
const EventEmitter = require('events').EventEmitter;
const {writeBlobHeader, writeBlob} = require('./protos/fileformat-pbf');
const osmPbfBlobEncode = require('./osm-pbf-blob-encode');
const osmPbfBlobEncodeHeader = require('./osm-pbf-blob-encode-header');

const blockItemLength = 8000;

class OsmPbfStreamWriter {
  constructor(targetpath, compress = true, dense = true) {
    this.geos = [];

    this.stream = fs.createWriteStream(targetpath);
    this.events = new EventEmitter();

    this.compress = compress;
    this.dense = dense;

    this._flushHeader();
  }

  _flushBlockToFile(fileBlock, type = 'OSMData') {
    const blobPbf = new Pbf();
    writeBlob(fileBlock, blobPbf);
    const blob = blobPbf.finish();

    const headerPbf = new Pbf();
    writeBlobHeader({type: type, datasize: blob.length}, headerPbf);
    const blobHeader = headerPbf.finish();

    const headerSize = blobHeader.length;

    const headerSizeBuffer = Buffer.allocUnsafe(4);
    headerSizeBuffer.writeInt32BE(headerSize);

    this.stream.write(headerSizeBuffer);
    this.stream.write(Buffer.from(blobHeader));
    this.stream.write(Buffer.from(blob));
    this.events.emit('flush', headerSize + blobHeader.length + blob.length);
  }

  _flushHeader() {
    const fileBlock = osmPbfBlobEncodeHeader(this.compress, this.dense);
    this._flushBlockToFile(fileBlock, 'OSMHeader');
  }

  _flushGeos() {
    if (this.geos.length) {
      const fileBlock = osmPbfBlobEncode(this.geos, this.compress, this.dense);
      this.geos = [];
      this._flushBlockToFile(fileBlock);
    }
  }
  
  addGeo(geo) {
    this.geos.push(geo);
    if (this.geos.length >= blockItemLength) {
      this._flushGeos();
    }
  }

  finish() {
    this._flushGeos();
    this.stream.end(() => {
      this.events.emit('finish');
    });
  }

  on(eventName, listener) {
    return this.events.on(eventName, listener);
  }
}

module.exports = OsmPbfStreamWriter;
