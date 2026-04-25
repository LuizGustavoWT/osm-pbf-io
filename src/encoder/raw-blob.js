const zlib = require('zlib');

module.exports = (rawBlob, compress) => {
  if (compress) {
    const compressedBlob = zlib.deflateSync(Buffer.from(rawBlob));
    return {
      raw_size: rawBlob.length,
      zlib_data: compressedBlob
    };
  }

  return {
    raw: rawBlob
  };
};
