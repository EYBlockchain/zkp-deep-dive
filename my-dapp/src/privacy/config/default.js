import { deferConfig as defer } from 'config/defer';

const nodeHashLength = process.env.HASH_TYPE === 'mimc' ? 32 : 27;
const zeroHex =
  process.env.HASH_TYPE === 'mimc'
    ? '0x0000000000000000000000000000000000000000000000000000000000000000'
    : '0x000000000000000000000000000000000000000000000000000000';

module.exports = {
  // Tree parameters. You also need to set these in the MerkleTree.sol contract, and in my-dapp's ./config/merkle-tree/default.js config file.
  LEAF_HASHLENGTH: 32, // expected length of an input to a hash in bytes
  NODE_HASHLENGTH: nodeHashLength, // expected length of inputs to hashes up the merkle tree, in bytes
  PUBLIC_KEY_TREE_HEIGHT: 32, // Height of the PUBLIC KEY Merkle tree (defined so that of there was just a root, height would be 0)
  ZERO: zeroHex,

  // *****

  ZOKRATES_PACKING_SIZE: '128', // ZOKRATES_PRIME is approx 253-254bits (just shy of 256), so we pack field elements into blocks of 128 bits.
  ZOKRATES_PRIME: '21888242871839275222246405745257275088548364400416034343698204186575808495617', // decimal representation of the prime p of GaloisField(p)

  VK_PATHS: {
    NFTokenShield: {
      mint: '/app/proving-files/gm17/nft-mint/nft-mint-vk.json',
      transfer: '/app/proving-files/gm17/nft-transfer/nft-transfer-vk.json',
      burn: '/app/proving-files/gm17/nft-burn/nft-burn-vk.json',
    },
  },

  GAS_PRICE: 20000000000,

  web3ProviderURL: defer(function getWeb3ProviderURL() {
    return `${process.env.BLOCKCHAIN_HOST}:${process.env.BLOCKCHAIN_PORT}`;
  }),

  merkleTree: {
    host: process.env.MERKLE_TREE_HOST,
    port: process.env.MERKLE_TREE_PORT,
    url: defer(function getAccountURL() {
      return `${this.merkleTree.host}:${this.merkleTree.port}`;
    }),
  },
};
