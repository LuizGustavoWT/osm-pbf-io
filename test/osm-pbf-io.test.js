const {describe, it} = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {Reader, Writer, Types} = require('../index.js');

describe('osm-pbf-io', () => {
  const testFile = path.join(os.tmpdir(), `osm-pbf-test-${Date.now()}.osm.pbf`);

  const nodes = [
    {id: 1, type: Types.node, lat: 18.766886, lng: 99.017465, tags: {name: 'test_node'}},
    {id: 2, type: Types.node, lat: 18.761441, lng: 99.019739, tags: {}}
  ];

  const ways = [
    {id: 3, type: Types.way, refs: [1, 2], tags: {name: 'test_way'}}
  ];

  const relations = [
    {id: 4, type: Types.relation, members: [
      {id: 1, role: 'test_role', type: Types.node},
      {id: 3, role: 'test_role', type: Types.way}
    ]}
  ];

  it('should write and read OSM PBF file', async () => {
    await new Promise((resolve, reject) => {
      const writer = new Writer(testFile);

      writer.on('finish', () => {
        resolve();
      });

      nodes.forEach(node => writer.addGeo(node));
      ways.forEach(way => writer.addGeo(way));
      relations.forEach(relation => writer.addGeo(relation));
      writer.finish();
    });

    assert.ok(fs.existsSync(testFile), 'File should exist');
    const stats = fs.statSync(testFile);
    assert.ok(stats.size > 0, 'File should not be empty');

    const readNodes = [];
    const readWays = [];
    const readRelations = [];

    await new Promise((resolve, reject) => {
      const reader = new Reader(testFile);

      reader.on('nodes', nodes => {
        readNodes.push(...nodes);
      });

      reader.on('ways', ways => {
        readWays.push(...ways);
      });

      reader.on('relations', relations => {
        readRelations.push(...relations);
      });

      reader.on('finish', () => {
        resolve();
      });

      reader.start();
    });

    assert.strictEqual(readNodes.length, 2, 'Should read 2 nodes');
    assert.strictEqual(readNodes[0].id, 1);
    assert.strictEqual(readNodes[0].tags.name, 'test_node');
    assert.ok(Math.abs(readNodes[0].lat - 18.766886) < 1e-6);
    assert.ok(Math.abs(readNodes[0].lng - 99.017465) < 1e-6);
    assert.strictEqual(readNodes[1].id, 2);

    assert.strictEqual(readWays.length, 1, 'Should read 1 way');
    assert.strictEqual(readWays[0].id, 3);
    assert.deepStrictEqual(readWays[0].refs, [1, 2]);
    assert.strictEqual(readWays[0].tags.name, 'test_way');

    assert.strictEqual(readRelations.length, 1, 'Should read 1 relation');
    assert.strictEqual(readRelations[0].id, 4);
    assert.strictEqual(readRelations[0].members.length, 2);
    assert.strictEqual(readRelations[0].members[0].id, 1);
    assert.strictEqual(readRelations[0].members[0].role, 'test_role');
    assert.strictEqual(readRelations[0].members[0].type, Types.node);
    assert.strictEqual(readRelations[0].members[1].id, 3);
    assert.strictEqual(readRelations[0].members[1].type, Types.way);
  });

  it('should write and read with metadata', async () => {
    const metaFile = path.join(os.tmpdir(), `osm-pbf-meta-${Date.now()}.osm.pbf`);
    const timestamp = new Date('2024-01-15T10:30:00Z');

    const metaNodes = [
      {id: 10, type: Types.node, lat: 10.0, lng: 20.0, tags: {amenity: 'cafe'}, version: 5, timestamp, changeSet: 12345, uid: 42, username: 'testuser'}
    ];

    await new Promise((resolve, reject) => {
      const writer = new Writer(metaFile);
      writer.on('finish', resolve);
      metaNodes.forEach(node => writer.addGeo(node));
      writer.finish();
    });

    const readNodes = [];
    await new Promise((resolve, reject) => {
      const reader = new Reader(metaFile);
      reader.on('nodes', nodes => readNodes.push(...nodes));
      reader.on('finish', resolve);
      reader.start();
    });

    assert.strictEqual(readNodes.length, 1);
    assert.strictEqual(readNodes[0].version, 5);
    assert.strictEqual(readNodes[0].changeSet, 12345);
    assert.strictEqual(readNodes[0].uid, 42);
    assert.strictEqual(readNodes[0].username, 'testuser');
    assert.strictEqual(readNodes[0].timestamp.getTime(), timestamp.getTime());

    fs.unlinkSync(metaFile);
  });

  it('should write and read dense nodes', async () => {
    const denseFile = path.join(os.tmpdir(), `osm-pbf-dense-${Date.now()}.osm.pbf`);
    const denseNodes = [];
    for (let i = 1; i <= 100; i++) {
      denseNodes.push({
        id: i,
        type: Types.node,
        lat: 10 + i * 0.001,
        lng: 20 + i * 0.001,
        tags: i % 2 === 0 ? {name: `node_${i}`} : {}
      });
    }

    await new Promise((resolve, reject) => {
      const writer = new Writer(denseFile);
      writer.on('finish', resolve);
      denseNodes.forEach(node => writer.addGeo(node));
      writer.finish();
    });

    const readNodes = [];
    await new Promise((resolve, reject) => {
      const reader = new Reader(denseFile);
      reader.on('nodes', nodes => readNodes.push(...nodes));
      reader.on('finish', resolve);
      reader.start();
    });

    assert.strictEqual(readNodes.length, 100);
    for (let i = 0; i < 100; i++) {
      assert.strictEqual(readNodes[i].id, i + 1);
      if (i % 2 === 1) {
        assert.strictEqual(readNodes[i].tags.name, `node_${i + 1}`);
      }
    }

    fs.unlinkSync(denseFile);
  });

  it('cleanup', () => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });
});
