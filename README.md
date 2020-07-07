# zkp-deep-dive

This repo contains a demonstration of how to make an existing ERC-721 application _private_.

If you have an existing ERC-721 application, hopefully the code in this repo might guide you towards adding functionality for _private_ transfers of users' tokens.

Any 'extra' privacy logic (both Solidity and Node.js) that you might need to add to your application is neatly contained in folders named `privacy`; the rest of the code resembles a conventional (non-private) dApp.

**Note that this code is for demonstration only and it has not yet completed a security review. We therefore strongly recommend that you do not use it in production or to transfer items of material value. We take no responsibility for any loss you may incur through the use of this code.**

As well as this repo, please be sure to check out:

- [Nightfall](https://github.com/EYBlockchain/nightfall) - for a full demonstration application, with:
  - UI
  - Auth
  - DB
  - ETH account management
  - ERC-20/721 contracts*
  - private transaction logic*
  - Merkle tree logic*
  - zk-SNARK tools*
  - privacy contracts*
  - private messaging
  - private data management

  (_*Only the asterisked features are included in this 'zkp-deep-dive' repo. For the other features, see Nightfall._)
- [Nightlite](https://github.com/EYBlockchain/nightlite) - a library containing core privacy logic:
  - private transaction logic
  - zk-SNARK tools
  - privacy contracts
- [TImber](https://github.com/EYBlockchain/timber) - a microservice for handling Merkle Tree logic and data between the blockchain, a local db, and the user.


Repo admin:
- [contributions.md](./contributing.md) to find out how to contribute code.
- [license.md](./license.md) to understand how we have placed this code completely in the public domain, without restrictions (but note that this repo makes use of others' open source code which _does_ apply licence conditions).
- [SECURITY.md](./SECURITY.md) to learn about how we handle security issues.
- [limitations.md](./limitations.md) to understand the limitations of the current code.

## Getting started

These instructions give the most direct path to a working setup. The application is compute-intensive and so a high-end processor is preferred. Depending on your machine, setup can take 10-30 mins.

### Supported hardware & prerequisites

Mac and Linux machines with at least 16GB of memory and 10GB of disk space are supported.

This demonstration requires the following software to run:

- Docker
  - Launch Docker Desktop (on Mac, it is on the menu bar) and set memory to 12GB with 4GB of swap space (minimum - 16GB memory is better). **The default values for Docker Desktop will NOT work. No, they really won't**.
- Node.js with npm and node-gyp.
- Xcode Command line tools:
  - If running macOS, install Xcode then run `xcode-select --install` to install command line tools.

### Starting servers

Start Docker:

- On Mac, open Docker.app.

### Installation

Clone this repository:

```sh
git clone git@github.com:EYBlockchain/zkp-deep-dive.git
```

or:

```sh
git clone https://github.com/EYBlockchain/zkp-deep-dive.git
```

Enter the directory:

```sh
cd <path/to/zkp-deep-dive>
```

For Linux users:

- Change permission for the directory

  ```sh
  sudo chmod 777 -R zkp/code/
  ```

- Add the Linux user to docker group to run Docker commands without sudo
  ([read more](https://docs.docker.com/install/linux/linux-postinstall/)). Then log out and enter
  again.

  ```sh
  sudo groupadd docker
  sudo usermod --append --groups docker $USER
  ```

For Mac & Linux users:

Install dependencies:

```sh
npm ci
```

Pull a compatible Docker image of ZoKrates

```sh
docker pull zokrates/zokrates:0.5.1
```

Next we have to generate the keys and constraint files for Zero Knowledge Proofs ([read more](./zkp/code/README-trusted-setup.md)), this is about 3GB in size. This step can take a while, depending on your hardware.
(Before you start, check once more that you have provisioned enough memory for Docker, as described above).

```sh
./generate-trusted-setup
```

Note that this is an automated run. For an initial installation, select the option to generate all files. For more information on the MiMC hashing option and further documentation on the setup process, see [the zkp module documentation](zkp/README.md).

Please be patient - you can check progress in the terminal window and by using `docker stats` in another terminal.

You just created all the files needed to generate zk-SNARKs. The proving keys, verifying keys and constraint files will allow you to create private erc-721 tokens, move them under zero knowledge and then recover them.

### Starting `my-dapp`

#### Re-installation

If you have just pulled new changes from the repo, then you might need to 're-install' certain features due to code changes. First run:

```sh
docker-compose build
```

It's important to re-run the trusted setup if any of the `.zok` files have been modified since your last pull of the repo:

```sh
./generate-trusted-setup
```

#### Starting

We're ready to go! Be sure to be in the main directory and run the demo:

```sh
./launch
```

This brings up each microservice using docker-compose.

Note that `./launch` has deployed an example ERC-721 contract for you (specifically NFTokenMetada.sol; PizzaTokens (PZZ)). This is designed to allow anyone to mint tokens for demonstration purposes. You will probably want to curtail this behaviour in anything but a demonstration.

Note that it can take up to 5 mins to compute a transfer proof (depending on your machine). You can see what's happening if you look at the terminal where you ran `./launch`.

If you want to close the application, make sure to stop containers and remove containers, networks,
volumes, and images created by up, using:

```sh
docker-compose down -v
```

### Run unit tests

You will need to have completed the trusted setup (see the Installation sction above).


```sh
docker-compose build
```

```sh
docker-compose run --rm truffle compile --all
docker-compose run --rm truffle migrate --reset --network=default
```

This will run ganache in a container; compile all of the contracts; and deploy them.  

To run the unit tests (in another terminal window):

```sh
docker-compose run --rm my-dapp npm test
```

The relevant files for these tests can be found under `./my-dapp/__tests__`.

-   `nft-controller.js` - These are units tests to verify mint, transfer and burn of ERC-721 tokens and ERC-721 commitments
-   `zkp-utils.js` - These are unit tests for utils used for running the tests.

Note that the `my-dapp` service tests take a while to run (approx. 30 mins)

### Use MiMC hashing

MiMC hashes use far fewer constraints in a zk-SNARK (so proofs are generated more quickly), but cost more gas than a SHA-256 hash (and so cost more money per transaction). Application developers will need to decide whether to prioritise low costs for users (sha256), or fast transaction times (MiMC). If you like, you can use MiMC hashing for merkle tree path calculation by selecting it during the 'trusted setup' installation step:

From the root directory:

```sh
cp docker-compose.override.mimc.yml docker-compose.override.yml
```
^^^ This creates an 'override' file, specially named so that any `docker-compose` commands will default to reading MiMC environment variables (from `docker-compose.override.yml`) instead of sha256 environment variables.

Run the trusted setup and type `y` when asked about setting up with `MiMC`:

```sh
./generate-trusted-setup
```

The `docker-compose.override.mimc.yml` file changes which merkle-tree-handling smart contracts the `truffle` container looks for, plus it tells the `my-dapp` and `merkle-tree` containers that any path calculations use MiMC.

You will find that, using MiMC, all proofs will compute much faster but cost more in gas.

When swapping from using MiMC hashes back to SHA-256 (or vice versa), remember to delete the contracts in the `./build` folder and shut down any open containers.


## Using other ERC-20 / ERC-721 contracts

This demo `my-dapp` will operate with any ERC-721 compliant contract. The contract's address is fed into NFTokenShield.sol respectively during the Truffle migration and cannot be changed subsequently.

If you wish to use pre-existing ERC-721 contracts then edit `./my-dapp/migrations/2_Shield_migration.js` so that the address of the pre-existing ERC-721 contract is passed to NFTokenShield.

## Using other networks

The demo mode uses Ganache-cli as a blockchain emulator. You'll need to use an Ethereum client to deploy to and transact with the Ethereum mainnet.

## Acknowledgements

The EY Blockchain R&D team thanks those who have indirectly contributed to this repo, with the ideas and tools that
they have shared with the community, including:

- [ZoKrates](https://hub.docker.com/r/michaelconnor/zok)
- [Libsnark](https://github.com/scipr-lab/libsnark)
- [Zcash](https://github.com/zcash/zcash)
- [GM17](https://eprint.iacr.org/2017/540.pdf)
- [0xcert](https://github.com/0xcert/ethereum-erc721/)
- [OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/ERC20.sol)
