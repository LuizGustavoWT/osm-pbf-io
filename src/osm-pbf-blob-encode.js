const Pbf = require('pbf').default;
const geoType = require('./osm-object-type');
const encodeNodes = require('./encoder/nodes');
const encodeDenseNodes = require('./encoder/dense-nodes');
const encodeWays = require('./encoder/ways');
const encodeRelations = require('./encoder/relations');
const encodeRawBlob = require('./encoder/raw-blob');
const {writePrimitiveBlock} = require('./protos/osmformat-pbf');

const defaultGranularity = 100;
const defaultDateGranularity = 1000;
const defaultLatOffset = 0;
const defaultLngOffset = 0;

class StringTable {
  constructor() {
    this.strings = [''];
    this.dict = {'': 0};
  }

  add(str) {
    if (this.dict[str] !== undefined) {
      return this.dict[str];
    }
    
    this.strings.push(str);
    this.dict[str] = this.strings.length - 1;
    return this.dict[str];
  }
}

module.exports = (geos, compress = true, denseNode = true) => {
  const nodes = geos.filter(geo => geo.type === geoType.node);
  const ways = geos.filter(geo => geo.type === geoType.way);
  const relations = geos.filter(geo => geo.type === geoType.relation);

  const stringTable = new StringTable();

  const settings = {
    granularity: defaultGranularity,
    lat_offset: defaultLatOffset,
    lon_offset: defaultLngOffset,
    date_granularity: defaultDateGranularity
  };

  const primitiveGroup = [];

  if (nodes.length) {
    if (denseNode) {
      primitiveGroup.push({
        nodes: [],
        dense: encodeDenseNodes(nodes, settings, stringTable),
        ways: [],
        relations: [],
        changesets: []
      });
    } else {
      primitiveGroup.push({
        nodes: encodeNodes(nodes, settings, stringTable),
        ways: [],
        relations: [],
        changesets: []
      });
    }
  }
  if (ways.length) {
    primitiveGroup.push({
      nodes: [],
      ways: encodeWays(ways, settings, stringTable),
      relations: []
    });
  }
  if (relations.length) {
    primitiveGroup.push({
      nodes: [],
      ways: [],
      relations: encodeRelations(relations, settings, stringTable)
    });
  }

  const primitiveBlock = {
    granularity: settings.granularity,
    lat_offset: settings.lat_offset,
    lon_offset: settings.lon_offset,
    date_granularity: settings.date_granularity,
    primitivegroup: primitiveGroup,
    stringtable: {
      s: stringTable.strings.map(str => Buffer.from(str))
    }
  };

  const pbf = new Pbf();
  writePrimitiveBlock(primitiveBlock, pbf);
  const rawBlob = pbf.finish();

  return encodeRawBlob(rawBlob, compress);
};
