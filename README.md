# SharkDAO Bidding Management

Simple contract to allow more flexible bidding on Nouns for SharkDAO

`contract` contains the SharkDaoBidder

`script` contains deployment

`test` contains unit tests


## Environment Configuration

The following variables must be included in your shell environment where you're executing the script. These can be placed in your `~/.zshrc` or `~/.bash_profile` as exports:

`RINKEBY_PRIVATE_KEY`: Private key for the address to use on **Rinkeby/Goerli** for deployment, settlement, etc.
`MAINNET_PRIVATE_KEY`: Private key for the address to use on **Rinkeby** for deployment, settlement, etc.
`ALCHEMY_RINKEBY_KEY`: Alchemy access key to use as a provider for blockchain data
`ALCHEMY_MAINNET_KEY`: Alchemy access key to use as a provider for blockchain data
`ETHERSCAN_KEY`: Etherscan API key to use for automated verification after deployment


## Testing Contract Locally

Install NPM dependencies `npm install`

Run tests locally with Hardhat `npx hardhat test`

All tests should pass


## Deploying Contract

After testing, deploy to your network of choice:

Rinkeby: `npx hardhat run scripts/deploy.js --network rinkeby`

Mainnet: `npx hardhat run scripts/deploy.js --network mainnet`

NounsAuctionHouseProxy address is required and hardcoded into `scripts/address.js`


## Test Network Testing Tools

Several tools are available to manage the auctions on test networks:

- `bid-auction --bid <bid_in_ETH> --noun <nounId> --network <networkName>`
  - Submit a bid to the current live auction. Bid should be supplied in ETH not wei/gwei.

- `settle-auction --network <networkName>`
  - Settle an auction whose bidding window has ended and kicks off the next auction

- `check-auction --network <networkName>`
  - Returns the status of the currently live auction.

- `get-image --noun <nounId> --network <networkName>`
  - Get the full image of the supplied Noun #. Stored as `.html` in the `img` folder. Open in a browser.
