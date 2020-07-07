/* eslint-disable import/no-unresolved */

import { erc721 as privateErc721 } from '@eyblockchain/nightlite';

import bc from '../src/utils/web3';
import { getContractAddress, getTruffleContractInstance } from '../src/utils/contract-utils';

// ERC-721:
import erc721 from '../src/nft-controller';

// privacy:
import utils from '../src/privacy/utils/zkp-utils';

jest.setTimeout(7200000);

// ERC-721:
let tokenId1;
let tokenId2;
let tokenId3;
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

beforeAll(async () => {
  if (!(await bc.isConnected())) await bc.connect();
  accounts = await (await bc.connection()).eth.getAccounts();
  const { contractJson, contractInstance } = await getTruffleContractInstance('NFTokenShield');
  erc721Address = await getContractAddress('NFTokenMetadata');
  const erc721AddressPadded = `0x${utils.strip0x(erc721Address).padStart(64, '0')}`;
  nfTokenShieldAddress = contractInstance.address;
  nfTokenShieldJson = contractJson;
  tokenId1 = await utils.rndHex(32);
  tokenId2 = await utils.rndHex(32);
  tokenId3 = await utils.rndHex(32);
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
});

describe('nft-controller.js tests', () => {
  test('Should mint ERC 721 token for Alice for asset 1', async () => {
    await erc721.mintNFToken(tokenId1, tokenURI, accounts[0]);
    expect((await erc721.getOwner(tokenId1)).toLowerCase()).toEqual(accounts[0].toLowerCase());
    expect(await erc721.getNFTURI(tokenId1)).toEqual(tokenURI);
  });

  test.skip('Should mint ERC 721 token for Alice for asset 2', async () => {
    await erc721.mintNFToken(tokenId2, tokenURI, accounts[0]);
    expect((await erc721.getOwner(tokenId2)).toLowerCase()).toEqual(accounts[0].toLowerCase());
  });

  test.skip('Should mint ERC 721 token for Alice for asset 3', async () => {
    await erc721.mintNFToken(tokenId3, tokenURI, accounts[0]);
    expect((await erc721.getOwner(tokenId3)).toLowerCase()).toEqual(accounts[0].toLowerCase());
  });

  test.skip('Should add Bob as approver for ERC 721 token for asset 3', async () => {
    await erc721.addApproverNFToken(accounts[1], tokenId3, accounts[0]);
    expect((await erc721.getApproved(tokenId3)).toLowerCase()).toEqual(accounts[1].toLowerCase());
  });

  test.skip('Should transfer ERC 721 token 3 from Alice to Bob', async () => {
    await erc721.transferNFToken(tokenId3, accounts[0], accounts[1]);
    expect((await erc721.getOwner(tokenId3)).toLowerCase()).toEqual(accounts[1].toLowerCase());
  });

  test.skip(`Should burn ERC 721 token 3 of Bob's`, async () => {
    const countBefore = await erc721.getBalance(accounts[1]);
    await erc721.burnNFToken(tokenId3, accounts[1]);
    expect((await erc721.getBalance(accounts[1])).toNumber()).toEqual(countBefore - 1);
  });

  test(`Should mint a private ERC 721 commitment (commitmentA1) for Alice's token (tokenIdA1)`, async () => {
    const { commitment: zTest, commitmentIndex: zIndex } = await privateErc721.mint(
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
    commitmentIndexA1 = parseInt(zIndex, 10);
    expect(commitmentA1).toEqual(zTest);
  });

  test(`Should privately transfer the ERC 721 token (tokenIdA1) from Alice to Bob, nullifying commitmentA1, and creating commitmentB1`, async () => {
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
    expect(outputCommitment).toEqual(commitmentB1);
  });

  test(`Should burn Bob's private ERC 721 commitment (commitmentB1) releasing the underlying public ERC-721 token (tokenId1)`, async () => {
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
    expect((await erc721.getOwner(tokenId1, '')).toLowerCase()).toEqual(accounts[1].toLowerCase());
  });
});
