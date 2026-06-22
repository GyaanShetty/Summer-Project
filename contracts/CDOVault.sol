// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract CDOVault {
    mapping(address => uint256) public collateralBalance;
    AggregatorV3Interface internal priceFeed;

    event DepositMade(address indexed user, uint256 amount);
    event WithdrawalMade(address indexed user, uint256 amount);

    constructor(address _priceFeedAddress) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }

    function deposit() external payable {
        require(msg.value > 0, "Deposit must be greater than zero");
        collateralBalance[msg.sender] += msg.value;
        emit DepositMade(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Withdraw amount must be greater than zero");
        require(collateralBalance[msg.sender] >= amount, "Insufficient balance");

        collateralBalance[msg.sender] -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");

        emit WithdrawalMade(msg.sender, amount);
    }

    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function getCollateralValueUSD(address user) external view returns (uint256) {
        uint256 ethBalance = collateralBalance[user];
        int256 ethPrice = getLatestPrice();
        require(ethPrice > 0, "Invalid price feed data");

        // Chainlink ETH/USD feed returns price with 8 decimals
        // ethBalance has 18 decimals (wei)
        // Result: USD value scaled to 18 decimals
        return (ethBalance * uint256(ethPrice)) / 1e8;
    }
}