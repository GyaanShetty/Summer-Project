const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CollateralManager", function () {
  let manager, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const CollateralManager = await ethers.getContractFactory("CollateralManager");
    // dummy vault address for now, real link happens once CDOVault tracks debt
    manager = await CollateralManager.deploy(owner.address);
    await manager.waitForDeployment();
  });

  it("Should return default ratio of 150 for any user", async function () {
    expect(await manager.getRatio(addr1.address)).to.equal(150);
  });

  it("Should return false for isLiquidatable when debt is zero", async function () {
    const result = await manager.isLiquidatable(addr1.address, ethers.parseEther("1000"), 0);
    expect(result).to.equal(false);
  });

  it("Should return false when ratio is above minimum (healthy position)", async function () {
    // $3000 collateral, $1500 debt = 200% ratio, above 150% minimum
    const result = await manager.isLiquidatable(
      addr1.address,
      ethers.parseEther("3000"),
      ethers.parseEther("1500")
    );
    expect(result).to.equal(false);
  });

  it("Should return true when ratio drops below minimum (liquidatable)", async function () {
    // $1400 collateral, $1000 debt = 140% ratio, below 150% minimum
    const result = await manager.isLiquidatable(
      addr1.address,
      ethers.parseEther("1400"),
      ethers.parseEther("1000")
    );
    expect(result).to.equal(true);
  });
});