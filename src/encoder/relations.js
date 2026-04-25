const encodeTags = require('./pbf-tags');
const encodeInfo = require('./pbf-info');

module.exports = (relations, settings, stringTable) => relations.map(relation => {
  const encodedTags = encodeTags(relation.tags, stringTable);

  const roles_sid = [];
  const memids = [];
  const types = [];

  let prevMemId = 0;

  for (let m = 0; m < relation.members.length; m++) {
    const member = relation.members[m];

    const rolesSid = stringTable.add(member.role);
    const memid = member.id - prevMemId;
    const type = member.type;

    roles_sid.push(rolesSid);
    memids.push(memid);
    types.push(type);

    prevMemId = member.id;
  }

  return {
    id: relation.id,
    keys: encodedTags.keys,
    vals: encodedTags.vals,
    info: encodeInfo(relation, settings, stringTable),
    roles_sid: roles_sid,
    memids: memids,
    types: types
  };
});
