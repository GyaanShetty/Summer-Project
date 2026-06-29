// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

interface ICollateralManager {
    function getRatio(address user) external view returns (uint256);
}

/// @notice The main collateral vault that accepts ETH deposits, tracks user balances,
///         fetches live ETH/USD pricing from Chainlink, and allows borrowing against collateral
contract CDOVault {
    mapping(address => uint256) public collateralBalance;
    mapping(address => uint256) public userDebt;

    AggregatorV3Interface internal priceFeed;
    ICollateralManager internal collateralManager;

    event DepositMade(address indexed user, uint256 amount);
    event WithdrawalMade(address indexed user, uint256 amount);
    event BorrowEvent(address indexed user, uint256 amount);

    constructor(address _priceFeedAddress, address _collateralManagerAddress) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        collateralManager = ICollateralManager(_collateralManagerAddress);
    }

    /// @notice Allows a user to deposit ETH as collateral into the vault
    function deposit() external payable {
        require(msg.value > 0, "Deposit must be greater than zero");
        collateralBalance[msg.sender] += msg.value;
        emit DepositMade(msg.sender, msg.value);
    }

    /// @notice Allows a user to withdraw a specified amount of their deposited ETH
    /// @param amount The amount of ETH (in wei) to withdraw
    function withdraw(uint256 amount) external {
        require(amount > 0, "Withdraw amount must be greater than zero");
        require(collateralBalance[msg.sender] >= amount, "Insufficient balance");

        collateralBalance[msg.sender] -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");

        emit WithdrawalMade(msg.sender, amount);
    }

    /// @notice Fetches the latest ETH/USD price from the Chainlink price feed
    /// @return The current ETH price in USD, scaled to 8 decimals (Chainlink standard)
    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    /// @notice Calculates the USD value of a user's deposited ETH collateral
    /// @param user The address of the user whose collateral value is being calculated
    /// @return The USD value of the user's collateral, scaled to 18 decimals
    function getCollateralValueUSD(address user) public view returns (uint256) {
        uint256 ethBalance = collateralBalance[user];
        int256 ethPrice = getLatestPrice();
        require(ethPrice > 0, "Invalid price feed data");
        return (ethBalance * uint256(ethPrice)) / 1e8;
    }

    /// @notice Calculates the maximum amount a user can borrow given their collateral and their required ratio from CollateralManager
    /// @param user The address whose max borrowable amount is being calculated
    /// @return The maximum borrowable amount in USD, scaled to 18 decimals
    function getMaxBorrowable(address user) public view returns (uint256) {
        uint256 collateralValue = getCollateralValueUSD(user);
        uint256 requiredRatio = collateralManager.getRatio(user);
        return (collateralValue * 100) / requiredRatio;
    }

    /// @notice Allows a user to borrow against their deposited collateral, up to the max allowed by their ratio
    /// @param amount The amount to borrow, in USD scaled to 18 decimals
    function borrow(uint256 amount) external {
        require(amount > 0, "Borrow amount must be greater than zero");

        uint256 maxBorrowable = getMaxBorrowable(msg.sender);
        uint256 newDebt = userDebt[msg.sender] + amount;

        require(newDebt <= maxBorrowable, "Exceeds max borrowable amount");

        userDebt[msg.sender] = newDebt;
        emit BorrowEvent(msg.sender, amount);
    }
}