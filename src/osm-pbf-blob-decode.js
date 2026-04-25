const zlib = require('zlib');
const Pbf = require('pbf').default;
const {readHeaderBlock, readPrimitiveBlock} = require('./protos/osmformat-pbf');
const decodePrimitiveBlockSettings = require('./decoder/primitive-block-settings');
const decodeDenseNodes = require('./decoder/dense-nodes');
const decodeNodes = require('./decoder/nodes');
const decodeWays = require('./decoder/ways');
const decodeRelations = require('./decoder/relations');

module.exports = (blob, blobHeader, parentEvents, withInfos = true) => {
  let rawBlob;
  if (blob.raw && blob.raw.length) {
    rawBlob = blob.raw;
  } else if (blob.zlib_data && blob.zlib_data.length) {
    rawBlob = zlib.inflateSync(Buffer.from(blob.zlib_data));
  } else {
    console.warn('Unreadable Blob');
    return;
  }

  if (blobHeader.type === 'OSMHeader') {
    parentEvents.emit('header', readHeaderBlock(new Pbf(rawBlob)));
    return;
  } else if (blobHeader.type !== 'OSMData') {
    console.warn(`Unknown BlobHeader type: ${blobHeader.type}`);
    return;
  }
  
  const primitiveBlock = readPrimitiveBlock(new Pbf(rawBlob));

  parentEvents.emit('primitive', primitiveBlock);

  const primitiveBlockSettings = decodePrimitiveBlockSettings(primitiveBlock);

  primitiveBlock.primitivegroup.forEach(primitiveGroup => {
    if (primitiveGroup.nodes && primitiveGroup.nodes.length) {
      parentEvents.emit('nodes', decodeNodes(primitiveGroup.nodes, primitiveBlockSettings));
    } else if (primitiveGroup.dense && primitiveGroup.dense.id && primitiveGroup.dense.id.length) {
      parentEvents.emit('nodes', decodeDenseNodes(primitiveGroup.dense, primitiveBlockSettings));
    } else if (primitiveGroup.ways && primitiveGroup.ways.length) {
      parentEvents.emit('ways', decodeWays(primitiveGroup.ways, primitiveBlockSettings));
    } else if (primitiveGroup.relations && primitiveGroup.relations.length) {
      parentEvents.emit('relations', decodeRelations(primitiveGroup.relations, primitiveBlockSettings));
    } else {
      console.warn('Unknown PrimitiveGroup Type');
    }
  });
}
