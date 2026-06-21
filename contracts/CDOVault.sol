// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract CDOVault {
    mapping(address => uint256) public collateralBalance;

    event DepositMade(address indexed user, uint256 amount);
    event WithdrawalMade(address indexed user, uint256 amount);

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
}