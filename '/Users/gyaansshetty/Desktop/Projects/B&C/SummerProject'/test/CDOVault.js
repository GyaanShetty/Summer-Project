const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CDOVault", function () {
  let vault, mockPriceFeed, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    // 8 decimals, initial price $3200.00000000 = 320000000000
    mockPriceFeed = await MockV3Aggregator.deploy(8, 320000000000);
    await mockPriceFeed.waitForDeployment();

    const CDOVault = await ethers.getContractFactory("CDOVault");
    vault = await CDOVault.deploy(await mockPriceFeed.getAddress());
    await vault.waitForDeployment();
  });

  it("Should accept ETH deposits and track balance", async function () {
    await vault.connect(addr1).deposit({ value: ethers.parseEther("1") });
    expect(await vault.collateralBalance(addr1.address)).to.equal(ethers.parseEther("1"));
  });

  it("Should revert deposit of zero ETH", async function () {
    await expect(
      vault.connect(addr1).deposit({ value: 0 })
    ).to.be.revertedWith("Deposit must be greater than zero");
  });

  it("Should allow withdrawal and update balance correctly", async function () {
    await vault.connect(addr1).deposit({ value: ethers.parseEther("1") });
    await vault.connect(addr1).withdraw(ethers.parseEther("0.4"));
    expect(await vault.collateralBalance(addr1.address)).to.equal(ethers.parseEther("0.6"));
  });

  it("Should revert withdrawal exceeding balance", async function () {
    await vault.connect(addr1).deposit({ value: ethers.parseEther("1") });
    await expect(
      vault.connect(addr1).withdraw(ethers.parseEther("2"))
    ).to.be.revertedWith("Insufficient balance");
  });

  it("Should return correct ETH price from oracle", async function () {
    const price = await vault.getLatestPrice();
    expect(price).to.equal(320000000000);
  });

  it("Should calculate correct USD collateral value", async function () {
    await vault.connect(addr1).deposit({ value: ethers.parseEther("1") });
    const usdValue = await vault.getCollateralValueUSD(addr1.address);
    // 1 ETH * $3200 = $3200, scaled to 18 decimals = 3200 * 1e18
    expect(usdValue).to.equal(ethers.parseEther("3200"));
  });
});