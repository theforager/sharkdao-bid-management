// SPDX-License-Identifier: GPL-3.0

/// @title SharkDAO Bidding Management Contract

/***********************************************************
░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░░░
░░░░▒▒░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░
░░░░░░▒▒░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░
░░░░░░▒▒▒▒░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░
░░░░░░▒▒▒▒▒▒░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░
░░░░░░░░▒▒▒▒▒▒░░▒▒████████████▒▒████████████▒▒▒▒▒▒▒▒░░░░░░░░
░░░░░░░░▒▒▒▒▒▒▒▒▒▒██░░░░██████▒▒██░░░░██████▒▒▒▒▒▒▒▒▒▒░░░░░░
░░░░░░░░░░▒▒████████░░░░██████████░░░░██████▒▒▒▒▒▒▒▒▒▒░░░░░░
░░░░░░░░░░▒▒██▒▒▒▒██░░░░██████▒▒██░░░░██████▒▒▒▒▒▒▒▒░░░░░░░░
░░░░░░░░▒▒▒▒▒▒░░▒▒████████████▒▒████████████▒▒▒▒▒▒░░░░░░░░░░
░░░░░░░░▒▒▒▒░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░
░░░░░░░░▒▒░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░▒▒░░▒▒░░▒▒░░░░░░░░░░░░
░░░░░░▒▒░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░▒▒░░▒▒░░▒▒▒▒░░░░░░░░░░░░
░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░▒▒▒▒▒▒████▒▒▒▒██▒▒▒▒██▒▒▒▒▒▒░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░▒▒▒▒░░██░░████░░████░░██▒▒▒▒░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░▒▒▒▒░░██░░██████████░░██▒▒▒▒░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░▒▒▒▒░░████▒▒██▒▒██▒▒██▒▒▒▒▒▒░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░▒▒▒▒░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░░
************************************************************/

pragma solidity ^0.8.6;

import { INounsAuctionHouse } from './interfaces/INounsAuctionHouse.sol';
import { IERC721 } from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';


contract SharkDaoBidder is Ownable {

    mapping(uint256 => uint256) public maxBids;
    mapping(address => bool) public daoBidders;
    INounsAuctionHouse auctionHouse;
    IERC721 nouns;

    // Equivalent to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    bytes4 internal constant ONERC721RECEIVED_FUNCTION_SIGNATURE = 0x150b7a02;


    constructor(address _nounsAuctionHouseAddress, address _nounsTokenAddress) {
        auctionHouse = INounsAuctionHouse(_nounsAuctionHouseAddress);
        nouns = IERC721(_nounsTokenAddress);
    }


    /**
        Modifier for Ensuring DAO Member Transactions
     */
    modifier onlyDaoBidder() {
        require(msg.sender == owner() || daoBidders[msg.sender], "Only usable by Owner or authorized DAO members");
        _;
    }


    /**
        Owner Maximum Bid, Treasury, & Contract Management Methods
     */
    function transferOwnership(address _newOwner) public override onlyOwner {
        require(address(this).balance == 0, "Pull funds before changing owner");
        require(nouns.balanceOf(address(this)) == 0, "Pull nouns before changing owner");

        super.transferOwnership(_newOwner);
    }

    function pullFunds() external onlyOwner {
        address ownerAddress = payable(owner());
        (bool sent, ) = ownerAddress.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
    }

    function pullNoun(uint256 _nounId) external onlyOwner {
        nouns.safeTransferFrom(address(this), owner(), _nounId);
    }

    function setMaxBid(uint256 _nounId, uint256 _maxBid) external payable onlyOwner {
        // The max bid can ONLY be set by the owner
        maxBids[_nounId] = _maxBid;
        require(address(this).balance >= _maxBid);
    }


    /**
        Specific Bid Send Methods
     */
    function addDaoBidder(address _bidder) public onlyDaoBidder {
        daoBidders[_bidder] = true;
    }
    
    function removeDaoBidder(address _bidder) public onlyDaoBidder {
        delete daoBidders[_bidder];
    }

    function submitBidUnderMax(uint256 _nounId, uint256 _proposedBid) public onlyDaoBidder {
        // Bids can be submitted by ANYONE in the DAO
        require(_proposedBid <= maxBids[_nounId], "Proposed bid is above max");
        auctionHouse.createBid{value: _proposedBid}(_nounId);
    }


    /**
        ETH & Nouns ERC-721 Receiving and Sending
     */
    receive() external payable {} // Receive Ether w/o msg.data
    fallback() external payable {} // Receive Ether w/ msg.data

    function onERC721Received(address, address, uint256, bytes memory) pure external returns (bytes4) {
        return ONERC721RECEIVED_FUNCTION_SIGNATURE; // Required per EIP-721
    }
}
