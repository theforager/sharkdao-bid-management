const { expect } = require("chai");
const { ethers, network } = require('hardhat');
const { address } = require('../scripts/address.js');
const { abi } = require('../scripts/abi.js');

const bidderBuild = require('../artifacts/contracts/SharkDaoBidder.sol/SharkDaoBidder.json');
const bidderAbi = bidderBuild.abi;



/**
 * Helper functions
 */
async function impersonateAccount(address){
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address]}
  )
}

async function stopImpersonatingAccount(address){
  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [address]}
  )
}

async function networkReset(){
  await network.provider.request({
    method: "hardhat_reset",
    params: [{
      forking: {
        jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_KEY}`,
        blockNumber: 13297486 // Sep-25-2021 09:44:19 PM +UTC
      }
    }]
  })
}



/**
 * Run Test Suite
 */
describe("SharkDaoBidder Mainnet Test", function () {

  // Contract addresses
  const SHARK_BIDDER_ADDRESS = '0xD1977351532fE19C43d8B3E209570c3dF02D2241';
  const SHARK_MULTISIG_ADDRESS = '0xAe7f458667f1B30746354aBC3157907d9F6FD15E';
  const NOUN_TOKEN_ADDRESS = address.nounsToken['mainnet'];
  
  // Key User addresses
  const FORAGER_ADDRESS = '0x286cD2FF7Ad1337BaA783C345080e5Af9bBa0b6e';
  const NOUNS_WHALE_ADDRESS = '0x43a330dec81bbd5e21f41c6b8354e54d481efc93';
  const BIDDER_DEPLOYER_ADDRESS = '0xf49478bbBB27Cc7A5e17D42588960195d127338b';
  const SHARK_GOLDY_ADDRESS = '0x021edd67d43B365a6401a5Ee704Aa6f264F3F4e4';

  let sharkBidderContract = new ethers.Contract(SHARK_BIDDER_ADDRESS, bidderAbi);
  let nounsTokenContract = new ethers.Contract(NOUN_TOKEN_ADDRESS, abi.nounsToken);

  let forager, goldy, deployer;


  /**
   * Setup: Get signers and network config
   */
  before("Setup signers", async function() {
    forager = await ethers.provider.getSigner(FORAGER_ADDRESS);
    goldy = await ethers.provider.getSigner(SHARK_GOLDY_ADDRESS);
    nounWhale = await ethers.provider.getSigner(NOUNS_WHALE_ADDRESS);
    deployer = await ethers.provider.getSigner(BIDDER_DEPLOYER_ADDRESS);
  });

  /**
   * Ownable: 
   */
  describe("Noun Token Management", async function() {
    beforeEach("Reset network setup", async function() {
      await networkReset();

      await impersonateAccount(NOUNS_WHALE_ADDRESS);
      await nounsTokenContract.connect(nounWhale).transferFrom(NOUNS_WHALE_ADDRESS, SHARK_BIDDER_ADDRESS, 48);
      await nounsTokenContract.connect(nounWhale).transferFrom(NOUNS_WHALE_ADDRESS, SHARK_BIDDER_ADDRESS, 49);

      // console.log(`Before 48: ${await nounsTokenContract.connect(nounWhale).ownerOf(48)}`);
      // console.log(`Before 49: ${await nounsTokenContract.connect(nounWhale).ownerOf(49)}`);
    });

    it("Should stop Forager from withdrawing Nouns", async function() {
      await impersonateAccount(FORAGER_ADDRESS);

      expect( sharkBidderContract.connect(forager).pullNoun(48) ).to.be.reverted;
      expect( sharkBidderContract.connect(forager).pullNoun(49) ).to.be.reverted;
    });

    it("Should allow Goldy (authorized bidder) to withdraw Nouns", async function() {
      await impersonateAccount(SHARK_GOLDY_ADDRESS);

      expect(await nounsTokenContract.connect(goldy).ownerOf(48)).to.equal(SHARK_BIDDER_ADDRESS);
      expect(await nounsTokenContract.connect(goldy).ownerOf(49)).to.equal(SHARK_BIDDER_ADDRESS);

      await sharkBidderContract.connect(goldy).pullNoun(48);
      await sharkBidderContract.connect(goldy).pullNoun(49);

      expect(await nounsTokenContract.connect(goldy).ownerOf(48)).to.equal(BIDDER_DEPLOYER_ADDRESS);
      expect(await nounsTokenContract.connect(goldy).ownerOf(49)).to.equal(BIDDER_DEPLOYER_ADDRESS);
    });

    it("Should require Nouns and funds to be withdrawn before transferring ownership", async function() {
      await impersonateAccount(BIDDER_DEPLOYER_ADDRESS);

      // Should fail as bidder has ETH and Nouns
      expect( sharkBidderContract.connect(deployer).transferOwnership(SHARK_MULTISIG_ADDRESS) ).to.be.reverted;

      const deployerStartBalance = await ethers.provider.getBalance(BIDDER_DEPLOYER_ADDRESS);
      const bidderStartBalance = await ethers.provider.getBalance(SHARK_BIDDER_ADDRESS);

      const tx1 = await sharkBidderContract.connect(deployer).pullFunds();
      const rcp1 = await tx1.wait();
      const gasEth1 = rcp1.gasUsed.mul(tx1.gasPrice);

      expect(await ethers.provider.getBalance(BIDDER_DEPLOYER_ADDRESS)).to.equal(deployerStartBalance.add(bidderStartBalance).sub(gasEth1));
      expect(await ethers.provider.getBalance(SHARK_BIDDER_ADDRESS)).to.equal(0);

      // Should still fail because of Nouns
      expect( sharkBidderContract.connect(deployer).transferOwnership(SHARK_MULTISIG_ADDRESS) ).to.be.reverted;

      await sharkBidderContract.connect(deployer).pullNoun(48);
      await sharkBidderContract.connect(deployer).pullNoun(49);
      
      // Should allow transfer
      await sharkBidderContract.connect(deployer).transferOwnership(SHARK_MULTISIG_ADDRESS);

      expect(await sharkBidderContract.connect(deployer).owner() ).to.equal(SHARK_MULTISIG_ADDRESS);
    });
  });
});
