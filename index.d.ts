import { EventEmitter } from 'events';

export interface OsmNode {
  id: number;
  lat: number;
  lng: number;
  type: 0;
  tags?: Record<string, string>;
  version?: number;
  timestamp?: Date;
  changeSet?: number;
  uid?: number;
  username?: string;
}

export interface OsmWay {
  id: number;
  refs: number[];
  type: 1;
  tags?: Record<string, string>;
  version?: number;
  timestamp?: Date;
  changeSet?: number;
  uid?: number;
  username?: string;
}

export interface RelationMember {
  id: number;
  role: string;
  type: 0 | 1 | 2;
}

export interface OsmRelation {
  id: number;
  members: RelationMember[];
  type: 2;
  tags?: Record<string, string>;
  version?: number;
  timestamp?: Date;
  changeSet?: number;
  uid?: number;
  username?: string;
}

export type OsmGeo = OsmNode | OsmWay | OsmRelation;

export interface HeaderBlock {
  bbox?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  required_features: string[];
  optional_features: string[];
  writingprogram: string;
  source: string;
  osmosis_replication_timestamp: number;
  osmosis_replication_sequence_number: number;
  osmosis_replication_base_url: string;
}

export interface PrimitiveBlock {
  stringtable: { s: Buffer[] };
  primitivegroup: PrimitiveGroup[];
  granularity: number;
  lat_offset: number;
  lon_offset: number;
  date_granularity: number;
}

export interface PrimitiveGroup {
  nodes: Node[];
  dense?: DenseNodes;
  ways: Way[];
  relations: Relation[];
  changesets: ChangeSet[];
}

export interface Node {
  id: number;
  keys: number[];
  vals: number[];
  info?: Info;
  lat: number;
  lon: number;
}

export interface DenseNodes {
  id: number[];
  denseinfo?: DenseInfo;
  lat: number[];
  lon: number[];
  keys_vals: number[];
}

export interface Info {
  version: number;
  timestamp: number;
  changeset: number;
  uid: number;
  user_sid: number;
  visible: boolean;
}

export interface DenseInfo {
  version: number[];
  timestamp: number[];
  changeset: number[];
  uid: number[];
  user_sid: number[];
  visible: boolean[];
}

export interface Way {
  id: number;
  keys: number[];
  vals: number[];
  info?: Info;
  refs: number[];
}

export interface Relation {
  id: number;
  keys: number[];
  vals: number[];
  info?: Info;
  roles_sid: number[];
  memids: number[];
  types: number[];
}

export interface ChangeSet {
  id: number;
}

export interface Blob {
  raw?: Buffer;
  raw_size: number;
  zlib_data?: Buffer;
  lzma_data?: Buffer;
  OBSOLETE_bzip2_data?: Buffer;
}

export interface BlobHeader {
  type: string;
  indexdata?: Buffer;
  datasize: number;
}

export interface ReaderEvents {
  nodes: (nodes: OsmNode[]) => void;
  ways: (ways: OsmWay[]) => void;
  relations: (relations: OsmRelation[]) => void;
  header: (header: HeaderBlock) => void;
  primitive: (primitive: PrimitiveBlock) => void;
  finish: () => void;
  chunk: (chunk: Buffer) => void;
  fileBlock: (blob: Blob, blobHeader: BlobHeader, blobHeaderLength: number) => void;
}

export interface WriterEvents {
  flush: (size: number) => void;
  finish: () => void;
}

export class Reader {
  constructor(sourcePath: string);
  start(): void;
  on<K extends keyof ReaderEvents>(eventName: K, listener: ReaderEvents[K]): EventEmitter;
}

export class Writer {
  constructor(targetpath: string, compress?: boolean, dense?: boolean);
  addGeo(geo: OsmGeo): void;
  finish(): void;
  on<K extends keyof WriterEvents>(eventName: K, listener: WriterEvents[K]): EventEmitter;
}

export const Types: {
  node: 0;
  way: 1;
  relation: 2;
};
