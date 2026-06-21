const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CDOVault", function () {
  let vault, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const CDOVault = await ethers.getContractFactory("CDOVault");
    vault = await CDOVault.deploy();
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
});