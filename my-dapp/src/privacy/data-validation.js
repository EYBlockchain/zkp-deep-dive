/**
@module data-validation.js
@author Westlad, Chaitanya-Konda, iAmMichaelConnor
@desc This code validates private transaction data against blockchain and db records.
*/

import config from 'config';
import { merkleTree } from '@eyblockchain/nightlite';

import utils from './utils/zkp-utils';

/**
checks the details of an incoming (newly transferred token), to ensure the data we have received is correct and legitimate.
*/
async function checkCorrectness(
  erc721Address,
  asset,
  publicKey,
  salt,
  commitment,
  commitmentIndex,
  blockNumber,
  nfTokenShield,
) {
  console.log('Checking h(asset|publicKey|salt) = commitment...');
  const commitmentCheck = utils.concatenateThenHash(
    `0x${utils.strip0x(erc721Address).padStart(64, '0')}`,
    utils.strip0x(asset).slice(-(config.LEAF_HASHLENGTH * 2)),
    publicKey,
    salt,
  );
  const commitmentCorrect = commitmentCheck === commitment; // eslint-disable-line camelcase
  console.log('commitment:', commitment);
  console.log('commitmentCheck:', commitmentCheck);

  console.log(
    'Checking the commitment exists in the merkle-tree db (and therefore was emitted as an event on-chain)...',
  );
  console.log('commitment:', commitment);
  console.log('commitmentIndex:', commitmentIndex);
  const { contractName } = nfTokenShield.constructor._json; // eslint-disable-line no-underscore-dangle

  // query the merkle-tree microservice until it's filtered the blockNumber we wish to query:
  await merkleTree.waitForBlockNumber(contractName, blockNumber);

  const leaf = await merkleTree.getLeafByLeafIndex(contractName, commitmentIndex);
  console.log('leaf found:', leaf);
  if (leaf.value !== commitment)
    throw new Error(
      `Could not find commitment ${commitment} at the given commitmentIndex ${commitmentIndex} in  the merkle-tree microservice. Found ${leaf.value} instead.`,
    );

  const commitmentOnchainCorrect = leaf.value === commitment; // eslint-disable-line camelcase
  console.log('commitment:', commitment);
  console.log('commitment emmitted by blockchain:', leaf.value);

  return {
    commitmentCorrect,
    commitmentOnchainCorrect,
  };
}

export default {
  checkCorrectness,
};
