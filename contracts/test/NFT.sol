// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import { ERC721 } from '@openzeppelin/contracts/token/ERC721/ERC721.sol';

contract NFT is ERC721('Test NFT','NFT') {
  uint256 mintCounter = 0;

  function mint(address _to) public {
    _safeMint(_to, mintCounter);
    mintCounter++;
  }
}