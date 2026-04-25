const Pbf = require('pbf').default;
const encodeRawBlob = require('./encoder/raw-blob');
const {writeHeaderBlock} = require('./protos/osmformat-pbf');

module.exports = (compress = true, dense = true) => {
  const pbf = new Pbf();
  writeHeaderBlock({
    required_features: [
      'OsmSchema-V0.6',
      ...(dense ? ['DenseNodes'] : [])
    ]
  }, pbf);
  const rawBlob = pbf.finish();

  return encodeRawBlob(rawBlob, compress);
};
