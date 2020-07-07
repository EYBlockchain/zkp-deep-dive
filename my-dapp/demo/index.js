/* eslint-disable import/no-unresolved */

import { erc721 as privateErc721 } from '@eyblockchain/nightlite';

import bc from '../src/utils/web3';
import { getContractAddress, getTruffleContractInstance } from '../src/utils/contract-utils';

// ERC-721:
import erc721 from '../src/nft-controller';

// privacy:
import utils from '../src/privacy/utils/zkp-utils';

// ERC-721:
let tokenId1;
const tokenURI = 'Pizza';
let accounts;
let erc721Address;

// privacy:
const secretKeyA = '0x0000000000111111111111111111111111111111111111111111111111111111';
const secretKeyB = '0x0000000000222222222222222222222222222222222222222222222222222222';
let publicKeyA;
let publicKeyB;
let saltA1;
let saltB1;
let commitmentA1;
let commitmentB1;
let commitmentIndexA1;
let nfTokenShieldJson;
let nfTokenShieldAddress;

async function initializeDemoValues() {
  console.log('\nInitializing demo values...');
  if (!(await bc.isConnected())) await bc.connect();
  accounts = await (await bc.connection()).eth.getAccounts();
  const { contractJson, contractInstance } = await getTruffleContractInstance('NFTokenShield');
  erc721Address = await getContractAddress('NFTokenMetadata');
  const erc721AddressPadded = `0x${utils.strip0x(erc721Address).padStart(64, '0')}`;

  nfTokenShieldAddress = contractInstance.address;
  nfTokenShieldJson = contractJson;
  tokenId1 = await utils.rndHex(32);
  publicKeyA = utils.ensure0x(utils.strip0x(utils.hash(secretKeyA)).padStart(32, '0'));
  publicKeyB = utils.ensure0x(utils.strip0x(utils.hash(secretKeyB)).padStart(32, '0'));
  saltA1 = await utils.rndHex(32);
  saltB1 = await utils.rndHex(32);
  commitmentA1 = utils.concatenateThenHash(
    erc721AddressPadded,
    utils.strip0x(tokenId1).slice(-32 * 2),
    publicKeyA,
    saltA1,
  );
  commitmentB1 = utils.concatenateThenHash(
    erc721AddressPadded,
    utils.strip0x(tokenId1).slice(-32 * 2),
    publicKeyB,
    saltB1,
  );
}

async function mint() {
  // Transact with the ordinary ERC-721 contract:
  await erc721.mintNFToken(tokenId1, tokenURI, accounts[0]);
  console.log(
    `\nSuccessfully minted a token ${tokenURI}, with tokenId ${tokenId1}, for account ${
      accounts[0]
    }\n`,
  );
}

// Mint a private commitment (representing the token) for Alice:
async function privateMint() {
  // Transact via Nightlite:
  const { commitment, commitmentIndex } = await privateErc721.mint(
    tokenId1,
    publicKeyA,
    saltA1,
    {
      erc721Address,
      account: accounts[0],
      nfTokenShieldJson,
      nfTokenShieldAddress,
    },
    {
      codePath: `${process.cwd()}/proving-files/gm17/nft-mint/out`,
      outputDirectory: `${process.cwd()}/proving-files/gm17/nft-mint`,
      pkPath: `${process.cwd()}/proving-files/gm17/nft-mint/proving.key`,
    },
  );

  commitmentIndexA1 = parseInt(commitmentIndex, 10);
  if (commitmentA1 !== commitment) throw new Error('Incorrect commitment');
}

// Transfer the private commitment from Alice to Bob:
async function privateTransfer() {
  const { outputCommitment } = await privateErc721.transfer(
    tokenId1,
    publicKeyB,
    saltA1,
    saltB1,
    secretKeyA,
    commitmentA1,
    commitmentIndexA1,
    {
      erc721Address,
      account: accounts[0],
      nfTokenShieldJson,
      nfTokenShieldAddress,
    },
    {
      codePath: `${process.cwd()}/proving-files/gm17/nft-transfer/out`,
      outputDirectory: `${process.cwd()}/proving-files/gm17/nft-transfer`,
      pkPath: `${process.cwd()}/proving-files/gm17/nft-transfer/proving.key`,
    },
  );

  if (commitmentB1 !== outputCommitment) throw new Error('Incorrect commitment');
}

async function privateBurn() {
  await privateErc721.burn(
    tokenId1,
    secretKeyB,
    saltB1,
    commitmentB1,
    commitmentIndexA1 + 1,
    {
      erc721Address,
      account: accounts[0],
      tokenReceiver: accounts[1],
      nfTokenShieldJson,
      nfTokenShieldAddress,
    },
    {
      codePath: `${process.cwd()}/proving-files/gm17/nft-burn/out`,
      outputDirectory: `${process.cwd()}/proving-files/gm17/nft-burn`,
      pkPath: `${process.cwd()}/proving-files/gm17/nft-burn/proving.key`,
    },
  );

  const burnedOwner = await erc721.getOwner(tokenId1);
  if (burnedOwner.toLowerCase() !== accounts[1].toLowerCase()) throw new Error('Unexpected owner');
}

const sleep = time => new Promise(resolve => setTimeout(resolve, time * 1000));

async function demoWrapper() {
  await initializeDemoValues();
  await sleep(0);

  await mint();
  await sleep(0);

  await privateMint();
  await sleep(0);

  await privateTransfer();
  await sleep(0);

  await privateBurn();
  await sleep(0);
}

demoWrapper();
