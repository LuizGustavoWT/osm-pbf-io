module.exports = (primitiveBlock, withInfos = true) => ({
  granularity: primitiveBlock.granularity,
  latOffset: primitiveBlock.lat_offset,
  lngOffset: primitiveBlock.lon_offset,
  dateGranularity: primitiveBlock.date_granularity,
  stringTable: {s: primitiveBlock.stringtable.s.map(bytes => bytes.toString())},
  withInfos: withInfos
});
