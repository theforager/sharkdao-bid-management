const { expect } = require("chai");
const { ethers } = require("hardhat");

const { parseUnits } = ethers.utils;


/**
 * Run Test Suite
 */
describe("SharkDaoBidder", function () {
  const auctionHouseProxyAddress = '0x830BD73E4184ceF73443C15111a1DF14e495C706';
  var owner, dao1, dao2, random;
  var nft, bidderContract, nonOwners;

  /**
   * Setup: Deploy contract 
   */
  before("Setup signers", async function() {
    const signers = await ethers.getSigners();
    owner = {signer: signers[0], address: await signers[0].getAddress()};
    dao1 = {signer: signers[1], address: await signers[1].getAddress()};
    dao2 = {signer: signers[2], address: await signers[2].getAddress()};
    random = {signer: signers[3], address: await signers[3].getAddress()};
    nonOwners = [dao1, dao2, random];

    console.log(`Executing tests with owner: ${owner.address}`);
  });

  beforeEach("Deploy contract", async function() {
    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy();
    await nft.deployed();

    const SharkDaoBidder = await ethers.getContractFactory("SharkDaoBidder");
    bidderContract = await SharkDaoBidder.deploy(auctionHouseProxyAddress, nft.address);
    await bidderContract.deployed();

    let addTx = await bidderContract.addDaoBidder(dao1.address);
    await addTx.wait();
  });


  /**
   * Ownable: 
   */
  describe("Ownership Management", async function() {
    it("Should have the correct owner assigned", async function() {
      expect(await bidderContract.owner()).to.equal(owner.address);
    });

    it("Should allow proper ownership transfer", async function() {
      const txAwayFromOwner = await bidderContract.connect(owner.signer).transferOwnership(dao1.address);
      await txAwayFromOwner.wait();
      expect(await bidderContract.owner()).to.equal(dao1.address);

      const txBackToOwner = await bidderContract.connect(dao1.signer).transferOwnership(owner.address);
      await txBackToOwner.wait();
      expect(await bidderContract.owner()).to.equal(owner.address);
    });
    
    it(`Should prevent transfering ownership from other addresses`, async function() {
      nonOwners.forEach(({signer, address}) => {
        expect( bidderContract.connect(signer).transferOwnership(address) ).to.be.reverted;
      });
    });

    it(`Should prevent transferring ownership if contract has Ether or Nouns`, async function() {
      await owner.signer.sendTransaction({to: bidderContract.address, value: parseUnits("0.01", "ether")});
      await expect( bidderContract.transferOwnership(dao1.address) ).to.be.reverted;

      await bidderContract.pullFunds();

      await bidderContract.transferOwnership(dao1.address);
      expect(await bidderContract.owner()).to.equal(dao1.address);
    });

    it(`Should prevent transferring ownership if contract has Ether or Nouns`, async function() {
      await nft.mint(bidderContract.address);
      await expect( bidderContract.transferOwnership(dao1.address) ).to.be.reverted;

      await bidderContract.pullNoun(0);

      await bidderContract.transferOwnership(dao1.address);
      expect(await bidderContract.owner()).to.equal(dao1.address);
    });
  });


  describe("Max Bid & Return", async function() {
    it("Should allow owner to withdraw all funds", async function() {
      let startBalance = await owner.signer.getBalance();
      let fundAmount = parseUnits("1", "ether");
      
      const tx1 = await owner.signer.sendTransaction({to: bidderContract.address, value: fundAmount});
      const rcp1 = await tx1.wait();
      const gasEth1 = rcp1.gasUsed.mul(tx1.gasPrice);

      expect(await owner.signer.getBalance()).to.equal(startBalance.sub(fundAmount).sub(gasEth1));

      const contractBal = await ethers.provider.getBalance(bidderContract.address);

      const tx2 = await bidderContract.pullFunds();
      const rcp2 = await tx2.wait();
      const gasEth2 = rcp2.gasUsed.mul(tx2.gasPrice);

      expect(await ethers.provider.getBalance(bidderContract.address)).to.equal(0);
      expect(await owner.signer.getBalance()).to.equal(startBalance.sub(fundAmount).sub(gasEth1).sub(gasEth2).add(contractBal));
    });

    it("Should prevent random non-bidders from withdrawing funds", async function() {
      let startBalance = await owner.signer.getBalance();
      let maxBid = parseUnits("2", "ether");
      
      const tx = await owner.signer.sendTransaction({to: bidderContract.address, value: maxBid});
      const rcp = await tx.wait();
      const gasEth = rcp.gasUsed.mul(tx.gasPrice);

      // Check random wallet cannot withdraw
      expect( bidderContract.connect(random.signer).pullFunds() ).to.be.reverted;
      expect(await ethers.provider.getBalance(bidderContract.address)).to.equal(maxBid);
      expect(await owner.signer.getBalance()).to.equal(startBalance.sub(maxBid).sub(gasEth));
    });

    it("Should allow bidders to withdraw funds only to owner", async function() {
      let ownerStartBalance = await owner.signer.getBalance();
      let dao1StartBalance = await dao1.signer.getBalance();
      let maxBid = parseUnits("2", "ether");
      
      const tx1 = await owner.signer.sendTransaction({to: bidderContract.address, value: maxBid});
      const rcp1 = await tx1.wait();
      const gasEth1 = rcp1.gasUsed.mul(tx1.gasPrice);

      // Confirm bidder withdraws ETH from contract to owner
      const tx2 = await bidderContract.connect(dao1.signer).pullFunds();
      const rcp2 = await tx2.wait();
      const gasEth2 = rcp2.gasUsed.mul(tx2.gasPrice);
      
      expect(await ethers.provider.getBalance(bidderContract.address)).to.equal(0);
      expect(await dao1.signer.getBalance()).to.equal(dao1StartBalance.sub(gasEth2));
      expect(await owner.signer.getBalance()).to.equal(ownerStartBalance.sub(gasEth1));
    });
  });


  describe("Bidding Account Management", async function() {
    it("Should enable any DAO bidder to add/remove other bidders", async function() {
      // Add dao2 as a bidder using the owner
      let addTx = await bidderContract.connect(owner.signer).addDaoBidder(dao2.address);
      await addTx.wait();

      expect(await bidderContract.daoBidders(dao2.address)).to.be.true;

      // Remove dao2 as bidder using another DAO member
      let removeTx = await bidderContract.connect(dao1.signer).removeDaoBidder(dao2.address);
      await removeTx.wait();
      
      expect(await bidderContract.daoBidders(dao2.address)).to.be.false;
    });

    it("Should prevent any non-DAO bidder from adding/removing other bidders", async function() {
      expect( bidderContract.connect(random.signer).addDaoBidder(random.address) ).to.be.reverted;
      expect( bidderContract.connect(random.signer).removeDaoBidder(random.address) ).to.be.reverted;
    });
  });


  describe("Receiving the NFT", async function() {
    it("Should be able to receive the NFT", async function() {
      await nft.mint(bidderContract.address);

      expect(await nft.balanceOf(bidderContract.address)).to.equal(1);
      expect(await nft.ownerOf(0)).to.equal(bidderContract.address);
    });

    it("Should be able to withdraw the NFT", async() => {
      await nft.mint(bidderContract.address);
      await bidderContract.pullNoun(0);

      expect(await nft.balanceOf(owner.address)).to.equal(1);
      expect(await nft.ownerOf(0)).to.equal(owner.address);
    });
  });


  describe("Submitting Bids", async function() {
    it("Should allow authorized bidders to bid", async function() {
      return true;
    });

    it("Should prevent non-authoized bidders from bidding", async function() {
      expect( bidderContract.connect(random.signer).submitBid(13, 2000000000000) ).to.be.reverted;
    });
  });
});
