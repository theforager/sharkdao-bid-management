# SharkDAO Bidding Management

This contract enables easier bid management for the Shark DAO in Nouns auctions.

### Functionality

Owner-Only:
 - `transferOwnership(address _newOwner)`: Transfer ownership to a new address `_newOwner` but requires pulling funds & Nouns first
 - `renounceOwnership()`: Transfer ownership to the burn address but requires pulling funds & Nouns first
 - 

DAO Bidder Only:
 - `removeDaoBidder(address _oldBidder)`: Remove the access of another DAO bidder `_oldBidder` (available for pre-emptive security but should not be abused)
 - `submitBid(uint256 _nounId, uint256 _bid)`: Submit an auction bid of `_bid` for the Noun `_noundId` (contract must have sufficient funds)
 - `pullFunds()`: Pull any ETH in the contract back to the Ownerr
 - `pullNoun(uint256 _nounId)`: Pull Noun # `_nounId` from the contract back to the Owner

Anyone:
 - `addFunds()`: Convience method to send Ether to contract (normally done by owner but left open to anyone if needed)

## Structure

Simple contract to allow more flexible bidding on Nouns for SharkDAO

`contract` contains the SharkDaoBidder

`script` contains deployment

`test` contains unit tests


## Setup & Configuration

## Initial Setup

Install NPM dependencies `npm install`

## Environment Configuration

The following variables must be included in your shell environment where you're executing the script. These can be placed in your `~/.zshrc` or `~/.bash_profile` as exports:

`RINKEBY_PRIVATE_KEY`: Private key for the address to use on **Rinkeby/Goerli** for deployment, settlement, etc.
`MAINNET_PRIVATE_KEY`: Private key for the address to use on **Rinkeby** for deployment, settlement, etc.
`ALCHEMY_RINKEBY_KEY`: Alchemy access key to use as a provider for blockchain data
`ALCHEMY_MAINNET_KEY`: Alchemy access key to use as a provider for blockchain data
`ETHERSCAN_KEY`: Etherscan API key to use for automated verification after deployment


## Testing & Deployment

## Testing Contract Locally

Run tests locally with Hardhat `npx hardhat test`

All tests should pass


## Deploying Contract

After testing, deploy to your network of choice:

Rinkeby: `npx hardhat run scripts/deploy.js --network rinkeby`

Mainnet: `npx hardhat run scripts/deploy.js --network mainnet`

NounsAuctionHouseProxy address is required and hardcoded into `scripts/address.js`


## Nouns Tools

Several tools are available to manage the auctions on test networks:

- `bid-auction --bid <bid_in_ETH> --noun <nounId> --network <networkName>`
  - Submit a bid to the current live auction. Bid should be supplied in ETH not wei/gwei.

- `settle-auction --network <networkName>`
  - Settle an auction whose bidding window has ended and kicks off the next auction

- `check-auction --network <networkName>`
  - Returns the status of the currently live auction.

- `get-image --noun <nounId> --network <networkName>`
  - Get the full image of the supplied Noun #. Stored as `.html` in the `img` folder. Open in a browser.
