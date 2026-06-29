// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @notice Tracks minimum collateral ratios per user and determines liquidation eligibility
contract CollateralManager {
    /// @notice The minimum collateral ratio (in basis points, 150 = 150%) required per user
    mapping(address => uint256) public minRatio;

    uint256 public constant DEFAULT_RATIO = 150;

    address public vault;

    constructor(address _vault) {
        vault = _vault;
    }

    /// @notice Sets the minimum ratio for a user. Defaults to 150 if never set.
    /// @param user The address whose ratio is being checked
    /// @return The minimum required collateral ratio for that user
    function getRatio(address user) public view returns (uint256) {
        if (minRatio[user] == 0) {
            return DEFAULT_RATIO;
        }
        return minRatio[user];
    }

    /// @notice Checks whether a user's position can be liquidated based on current ratio
    /// @param user The address being checked
    /// @param collateralValueUSD The user's current collateral value in USD (18 decimals)
    /// @param debtUSD The user's current debt in USD (18 decimals)
    /// @return True if the user's position is below the minimum required ratio
    function isLiquidatable(address user, uint256 collateralValueUSD, uint256 debtUSD) external view returns (bool) {
        if (debtUSD == 0) {
            return false;
        }
        uint256 currentRatio = (collateralValueUSD * 100) / debtUSD;
        return currentRatio < getRatio(user);
    }
}