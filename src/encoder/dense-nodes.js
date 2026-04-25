const encodeLatLng = require('./lat-lng');
const encodeTimestamp = require('./timestamp');

module.exports = (nodes, settings, stringTable) => {
  const pbf = {
    id: [],
    denseinfo: {
      version: [],
      timestamp: [],
      changeset: [],
      uid: [],
      user_sid: [],
      visible: []
    },
    lat: [],
    lon: [],
    keys_vals: []
  };

  let previousNodeId = 0;
  let previousLat = encodeLatLng(0, settings.lat_offset, settings.granularity);
  let previousLng = encodeLatLng(0, settings.lon_offset, settings.granularity);
  let previousChangeSet = 0;
  let previousTimestamp = 0;
  let previousUid = 0;
  let previousVersion = 0;
  let previousUsernameId = 0;

  nodes.forEach(node => {
    const currentLat = encodeLatLng(node.lat, settings.lat_offset, settings.granularity);
    const currentLng = encodeLatLng(node.lng, settings.lon_offset, settings.granularity);

    pbf.id.push(node.id - previousNodeId);
    pbf.lat.push(currentLat - previousLat);
    pbf.lon.push(currentLng - previousLng);

    if (node.tags) {
      const tagKeys = Object.keys(node.tags);
      if (tagKeys.length) {
        for (let i = 0; i < tagKeys.length; i++) {
          const key = tagKeys[i];
          const value = node.tags[key];
  
          pbf.keys_vals.push(stringTable.add(key));
          pbf.keys_vals.push(stringTable.add(value));
        }
      }
    }
    pbf.keys_vals.push(0);

    const changeSet = node.changeSet ? node.changeSet : 0;
    const timestamp = node.timestamp ? encodeTimestamp(node.timestamp, settings.date_granularity) : 0;
    const uid = node.uid ? node.uid : 0;
    const version = node.version ? node.version : 0;
    const username = node.username ? node.username : '';
    const usernameId = stringTable.add(username);

    pbf.denseinfo.changeset.push(changeSet - previousChangeSet);
    pbf.denseinfo.timestamp.push(timestamp - previousTimestamp);
    pbf.denseinfo.uid.push(uid - previousUid);
    pbf.denseinfo.version.push(version - previousVersion);
    pbf.denseinfo.user_sid.push(usernameId - previousUsernameId);
    pbf.denseinfo.visible.push(true);
    
    previousNodeId = node.id;
    previousLat = currentLat;
    previousLng = currentLng;
    previousChangeSet = changeSet;
    previousTimestamp = timestamp;
    previousUid = uid;
    previousVersion = version;
    previousUsernameId = usernameId;
  });

  return pbf;
};
