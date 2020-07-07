/**
This module acts as a layer of logic between the index.js, which lands the
rest api calls, and the heavy-lifitng token-zkp.js and zokrates.js.  It exists so that the amount of logic in restapi.js is absolutely minimised.
@module token-controller.js
@author westlad, Chaitanya-Konda, iAmMichaelConnor
*/

/* eslint-disable camelcase */

import contract from 'truffle-contract';
import jsonfile from 'jsonfile';

import Web3 from '../utils/web3';
import { getContractAddress, contractPaths } from '../utils/contract-utils';

import validation from './data-validation';

const NFTokenShield = contract(jsonfile.readFileSync(contractPaths.NFTokenShield));
NFTokenShield.setProvider(Web3.connect());

const Verifier = contract(jsonfile.readFileSync(contractPaths.Verifier));
Verifier.setProvider(Web3.connect());

const shield = {}; // this field holds the current Shield contract instance.

/**
This function allocates a specific NFTokenShield contract to a particular user
(or, more accurately, a particular Ethereum address)
@param {string} shieldAddress - the address of the shield contract you want to point to
@param {string} address - the Ethereum address of the user to whom this shieldAddress will apply
*/
async function setShield(shieldAddress, address) {
  if (shieldAddress === undefined) shield[address] = await getContractAddress('NFTokenShield');
  else shield[address] = await NFTokenShield.at(shieldAddress);
}

function unSetShield(address) {
  delete shield[address];
}

/**
return the address of the shield contract
*/
async function getShieldAddress(account) {
  const nfTokenShield = shield[account]
    ? shield[account]
    : await getContractAddress('NFTokenShield');
  return nfTokenShield.address;
}

async function checkCorrectness(
  erc721Address,
  tokenId,
  publicKey,
  salt,
  commitment,
  commitmentIndex,
  blockNumber,
  account,
) {
  const nfTokenShield = shield[account] ? shield[account] : await NFTokenShield.deployed();

  const results = await validation.checkCorrectness(
    erc721Address,
    tokenId,
    publicKey,
    salt,
    commitment,
    commitmentIndex,
    blockNumber,
    nfTokenShield,
  );
  console.log('\nnf-token-controller', '\ncheckCorrectness', '\nresults', results);

  return results;
}

export default {
  setShield,
  unSetShield,
  getShieldAddress,
  checkCorrectness,
};
