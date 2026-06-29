const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CDOVault", function () {
  let vault, mockPriceFeed, collateralManager, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    mockPriceFeed = await MockV3Aggregator.deploy(8, 320000000000); // $3200
    await mockPriceFeed.waitForDeployment();

    const CollateralManager = await ethers.getContractFactory("CollateralManager");
    collateralManager = await CollateralManager.deploy(owner.address);
    await collateralManager.waitForDeployment();

    const CDOVault = await ethers.getContractFactory("CDOVault");
    vault = await CDOVault.deploy(
      await mockPriceFeed.getAddress(),
      await collateralManager.getAddress()
    );
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

  it("Should actually send ETH back to user on withdrawal", async function () {
    await vault.connect(addr1).deposit({ value: ethers.parseEther("1") });
    const balanceBefore = await ethers.provider.getBalance(addr1.address);
    const tx = await vault.connect(addr1).withdraw(ethers.parseEther("1"));
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    const balanceAfter = await ethers.provider.getBalance(addr1.address);
    expect(balanceAfter).to.equal(balanceBefore + ethers.parseEther("1") - gasUsed);
  });

  it("Should return correct ETH price from oracle", async function () {
    const price = await vault.getLatestPrice();
    expect(price).to.equal(320000000000);
  });

  it("Should calculate correct USD collateral value", async function () {
    await vault.connect(addr1).deposit({ value: ethers.parseEther("1") });
    const usdValue = await vault.getCollateralValueUSD(addr1.address);
    expect(usdValue).to.equal(ethers.parseEther("3200"));
  });

  it("Should calculate correct max borrowable at 150% ratio", async function () {
    await vault.connect(addr1).deposit({ value: ethers.parseEther("1") });
    // $3200 collateral / 150% ratio = $2133.33...
    const maxBorrowable = await vault.getMaxBorrowable(addr1.address);
    const expected = (ethers.parseEther("3200") * 100n) / 150n;
    expect(maxBorrowable).to.equal(expected);
  });

  it("Should allow borrowing within max borrowable limit", async function () {
    await vault.connect(addr1).deposit({ value: ethers.parseEther("1") });
    // 60% LTV of $3200 = $1920, well within $2133 max
    await vault.connect(addr1).borrow(ethers.parseEther("1920"));
    expect(await vault.userDebt(addr1.address)).to.equal(ethers.parseEther("1920"));
  });

  it("Should revert borrow exceeding max borrowable limit", async function () {
    await vault.connect(addr1).deposit({ value: ethers.parseEther("1") });
    await expect(
      vault.connect(addr1).borrow(ethers.parseEther("3000"))
    ).to.be.revertedWith("Exceeds max borrowable amount");
  });
});