const hre = require("hardhat");
const { address } = require("./address.js");


async function main() {
  let network = hre.network.name;
  const [deployer] = await hre.ethers.getSigners();

  console.log(`Deploying contracts to ${network} with the account ${deployer.address}`);

  console.log(`Account balance: ${(await deployer.getBalance()).toString()}`);

  let auctionHouseAddress = address.auctionHouseProxy[network];
  let nounsAddress = address.nounsToken[network];

  const SharkDaoBidder = await ethers.getContractFactory("SharkDaoBidder");

  const bidderContract = await SharkDaoBidder.deploy(auctionHouseAddress, nounsAddress);

  console.log(`
    Shark DAO Bidder address: ${bidderContract.address}
    Auction House address: ${auctionHouseAddress}
    Nouns Token address: ${nounsAddress}
  `);
}

// Execute Deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
