/**
This module acts as a layer of logic between the index.js, which lands the
rest api calls, and the heavy-lifitng token-zkp.js and zokrates.js.  It exists so that the amount of logic in restapi.js is absolutely minimised.
@module token-controller.js
@author westlad, Chaitanya-Konda, iAmMichaelConnor
*/

/* eslint-disable camelcase */

import contract from 'truffle-contract';
import jsonfile from 'jsonfile';

import Web3 from './utils/web3';
import { getContractAddress, contractPaths } from './utils/contract-utils';

const NFTokenMetadata = contract(jsonfile.readFileSync(contractPaths.NFTokenMetadata));
NFTokenMetadata.setProvider(Web3.connect());

/**
return the name of the ERC-721 tokens
*/
async function getNFTName() {
  const nfToken = await NFTokenMetadata.at(await getContractAddress('NFTokenMetadata'));
  return nfToken.name.call();
}

/**
return the symbol of the ERC-721 tokens
*/
async function getNFTSymbol() {
  const nfToken = await NFTokenMetadata.at(await getContractAddress('NFTokenMetadata'));
  return nfToken.symbol.call();
}

/**
return the address of the ERC-721 token
*/
async function getNFTAddress() {
  return getContractAddress('NFTokenMetadata');
}

/**
return the symbol of the ERC-721 tokens
*/
async function getNFTURI(tokenID) {
  const nfToken = await NFTokenMetadata.at(await getContractAddress('NFTokenMetadata'));
  return nfToken.tokenURI.call(tokenID);
}

/**
return the number of tokens held by an account
*/
async function getBalance(address) {
  const nfToken = await NFTokenMetadata.at(await getContractAddress('NFTokenMetadata'));
  return nfToken.balanceOf.call(address);
}

/**
return the number of tokens held by an account
*/
async function getOwner(tokenID) {
  const nfToken = await NFTokenMetadata.at(await getContractAddress('NFTokenMetadata'));
  return nfToken.ownerOf.call(tokenID);
}

/**
create an ERC-721 Token in the account that calls the function
*/
async function mintNFToken(tokenID, tokenURI, address) {
  console.log(`\nMinting NF Token ${tokenID} for address ${address}`);
  const nfToken = await NFTokenMetadata.at(await getContractAddress('NFTokenMetadata'));
  return nfToken.mint(tokenID, tokenURI, {
    from: address,
    gas: 4000000,
  });
}

/**
Transfer ERC-721 Token from the owner's account to another account
*/
async function transferNFToken(tokenID, fromAddress, toAddress) {
  console.log(`Transferring NF Token ${tokenID} from ${fromAddress} to ${toAddress}`);
  const nfToken = await NFTokenMetadata.at(await getContractAddress('NFTokenMetadata'));
  return nfToken.safeTransferFrom(fromAddress, toAddress, tokenID, {
    from: fromAddress,
    gas: 4000000,
  });
}

/**
create an ERC-721 Token in the account that calls the function
*/
async function burnNFToken(tokenID, address) {
  console.log('Burning NF Token', tokenID, address);
  const nfToken = await NFTokenMetadata.at(await getContractAddress('NFTokenMetadata'));
  return nfToken.burn(tokenID, {
    from: address,
    gas: 4000000,
  });
}

/**
Add an approver for an ERC-721 Token
*/
async function addApproverNFToken(approved, tokenID, address) {
  console.log('Adding Approver for an NF Token', approved, tokenID, address);
  const nfToken = await NFTokenMetadata.at(await getContractAddress('NFTokenMetadata'));
  return nfToken.approve(approved, tokenID, {
    from: address,
    gas: 4000000,
  });
}

/**
Get an approver for an ERC-721 Token
*/
async function getApproved(tokenID) {
  console.log('Getting Approver for an NF Token', tokenID);
  const nfToken = await NFTokenMetadata.at(await getContractAddress('NFTokenMetadata'));
  return nfToken.getApproved.call(tokenID);
}

export default {
  getNFTName,
  getNFTSymbol,
  getNFTAddress,
  getNFTURI,
  getBalance,
  getOwner,
  mintNFToken,
  transferNFToken,
  burnNFToken,
  addApproverNFToken,
  getApproved,
};
