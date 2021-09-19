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
import { AccessControlEnumerable } from '@openzeppelin/contracts/access/AccessControlEnumerable.sol';


contract SharkDaoBidderEnumerable is AccessControlEnumerable {
    INounsAuctionHouse auctionHouse;
    IERC721 nouns;

    bytes32 public constant BIDDER_ROLE = keccak256("BIDDER_ROLE");

    // Equivalent to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    bytes4 internal constant ONERC721RECEIVED_FUNCTION_SIGNATURE = 0x150b7a02;


    constructor(address _nounsAuctionHouseAddress, address _nounsTokenAddress) {
        auctionHouse = INounsAuctionHouse(_nounsAuctionHouseAddress);
        nouns = IERC721(_nounsTokenAddress);

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(BIDDER_ROLE, _msgSender());
    }


    /**
        Modifier for Ensuring DAO Member Transactions
     */
    modifier pullAssetsFirst() {
        require(address(this).balance == 0, "Pull funds before changing ownership");
        require(nouns.balanceOf(address(this)) == 0, "Pull nouns before changing ownership");
        _;
    }


    /**
        Owner-only Privileged Methods for Contract & Access Expansion
     */
    function transferOwnership(address _newOwner) public pullAssetsFirst onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(BIDDER_ROLE, _newOwner);
        revokeRole(BIDDER_ROLE, _msgSender());
        
        grantRole(DEFAULT_ADMIN_ROLE, _newOwner);
        renounceRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function addDaoBidder(address _bidder) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(BIDDER_ROLE, _bidder);
    }

    function removeDaoBidder(address _bidder) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(BIDDER_ROLE, _bidder);
    }


    /**
        Authorized Bidder Functions for Bidding, Pulling Funds & Access
     */
    function addFunds() external payable {} // Convenience function for Etherscan, etc.

    function pullFunds(address _owner) external onlyRole(BIDDER_ROLE) {
        require(hasRole(DEFAULT_ADMIN_ROLE, _owner), "Destination is not an admin");

        address owner = payable(_owner);
        (bool sent, ) = owner.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
    }

    function pullNoun(address _owner, uint256 _nounId) external onlyRole(BIDDER_ROLE) {
        require(hasRole(DEFAULT_ADMIN_ROLE, _owner), "Destination is not an admin");

        nouns.safeTransferFrom(address(this), _owner, _nounId); // Nouns MUST go to Owner
    }

    function submitBid(uint256 _nounId, uint256 _proposedBid) public onlyRole(BIDDER_ROLE) {
        // Bids can be submitted by ANYONE in the DAO
        require(_proposedBid <= address(this).balance, "Proposed bid is above available contract funds");
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
