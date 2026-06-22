// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
/// @notice An ERC-20 token representing one risk tranche (Senior, Mezzanine, or Junior)
///         in the CDO structure, mintable and burnable only by the contract owner
contract TrancheToken is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {}
/// @notice Allows the contract owner to mint new tokens to a specified address
    /// @param to The address receiving the minted tokens
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
/// @notice Allows the contract owner to burn tokens from a specified address
    /// @param from The address whose tokens will be burned
    /// @param amount The amount of tokens to burn
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}