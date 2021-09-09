require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

const fs = require('fs');
const { abi } = require("./scripts/abi.js");
const { address } = require("./scripts/address.js");


// Key Required for Deployment / Verification
const RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY;
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;
const ALCHEMY_KEY = {
  'rinkeby': process.env.ALCHEMY_RINKEBY_KEY,
  'goerli': process.env.ALCHEMY_RINKEBY_KEY,
  'mainnet': process.env.ALCHEMY_MAINNET_KEY
};

const getAlchemy = (network) => new hre.ethers.providers.AlchemyProvider(network, ALCHEMY_KEY[network]);



/**
 * Bid on Current Auction
 */
 task("bid-auction", "Bid on the current Noun auction")
  .addParam("bid", "ETH amount to bid on the Noun")
  .addParam("noun", "ID of the Noun to place a bid on")
  .setAction(async (taskArgs, hre) => {
    const network = hre.network.name;
    const ethBidAmount = taskArgs.bid;
    const nounId = taskArgs.noun;
    
    if (!ethBidAmount || !nounId) {
      if (!ethBidAmount) console.log('No bid amount specified. Terminating bid...');
      if (!nounId) console.log('No noun ID specified. Terminating bid...');
      return;
    }

    const [signer] = await hre.ethers.getSigners();
    console.log(`Bidding ${ethBidAmount} ETH on ${network} with ${await signer.getAddress()}`);
    const auctionHouse = new hre.ethers.Contract(address.auctionHouseProxy[network], abi.auctionHouseProxy, signer);

    const weiBidAmount = hre.ethers.utils.parseEther(ethBidAmount);
    console.log(`   - bid in wei ${weiBidAmount}`);
    
    const currentAuction = await auctionHouse.createBid(nounId, {value: weiBidAmount});

    console.log(currentAuction);
});


/**
 * Settle the Current Auction
 */
task("settle-auction", "Settle the current auction and starts new auction", async (taskArgs, hre) => {
  const network = hre.network.name;
  const [signer] = await hre.ethers.getSigners();

  console.log(`Settling auction on ${network} with ${await signer.getAddress()}`);
  const auctionHouse = new hre.ethers.Contract(address.auctionHouseProxy[network], abi.auctionHouseProxy, signer);
  
  const currentAuction = await auctionHouse.settleCurrentAndCreateNewAuction();

  console.log(currentAuction);
});


/**
 * Check the Status of the Nouns Auction
 */
task("check-auction", "Checks the status of the current auction", async (taskArgs, hre) => {
  const network = hre.network.name;
  const alchemy = getAlchemy(network);

  const auctionHouse = new hre.ethers.Contract(address.auctionHouseProxy[network], abi.auctionHouseProxy, alchemy);
  const currentAuction = await auctionHouse.auction();

  let curSeconds = Math.floor(Date.now() / 1000);

  console.log(`
    NounID: ${currentAuction.nounId.toString()}
    
    Current Bid: ${hre.ethers.utils.formatEther(currentAuction.amount)}
    Top Bidder: ${currentAuction.bidder}

    Current Time: ${curSeconds}
    End Time: ${currentAuction.endTime.toString()}

    Auction Over? ${currentAuction.endTime < curSeconds}
    Settled?  ${currentAuction.settled}
  `);
});


/**
 * Get the Nouns SVG Image
 */
 task("get-image", "Gets the image for a given Nound ID")
  .addParam("noun", "ID of the Noun to place a bid on")
  .setAction(async (taskArgs, hre) => {
    const network = hre.network.name;
    const alchemy = getAlchemy(network);

    const nounsDescriptor = new hre.ethers.Contract(address.nounsDescriptor[network], abi.nounsDescriptor, alchemy);
    const nounsToken = new hre.ethers.Contract(address.nounsToken[network], abi.nounsToken, alchemy);

    const seed = await nounsToken.seeds(taskArgs.noun);
    
    console.log(`Noun #${taskArgs.noun} Seed:`);
    console.log(seed);

    const base64svg = await nounsDescriptor.generateSVGImage(seed);
    let svgHtml = `<img src="data:image/svg+xml;base64,${base64svg}"/>`;

    fs.writeFileSync(`img/noun${taskArgs.noun}.html`, svgHtml, (err) => {
        if (err) throw err;
    });
  });


/**
 * Print List of Accounts for the Network
 */
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});


/**
 * @type import('hardhat/config').HardhatUserConfig
 */     
module.exports = {
  solidity: "0.8.6",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY.rinkeby}`,
      accounts: [`0x${RINKEBY_PRIVATE_KEY}`],
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_KEY.goerli}`,
      accounts: [`0x${RINKEBY_PRIVATE_KEY}`],
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY.mainnet}`,
      accounts: [`0x${MAINNET_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: `${ETHERSCAN_KEY}`
  }
};
