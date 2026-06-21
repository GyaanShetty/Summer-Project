const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrancheToken", function () {
  let token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const TrancheToken = await ethers.getContractFactory("TrancheToken");
    token = await TrancheToken.deploy("Senior Tranche", "sCDO", owner.address);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await token.name()).to.equal("Senior Tranche");
      expect(await token.symbol()).to.equal("sCDO");
    });

    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      await token.mint(addr1.address, 1000);
      expect(await token.balanceOf(addr1.address)).to.equal(1000);
    });

    it("Should revert if non-owner tries to mint", async function () {
      await expect(
        token.connect(addr1).mint(addr1.address, 1000)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    it("Should allow owner to burn tokens", async function () {
      await token.mint(addr1.address, 1000);
      await token.burn(addr1.address, 400);
      expect(await token.balanceOf(addr1.address)).to.equal(600);
    });

    it("Should revert if non-owner tries to burn", async function () {
      await token.mint(addr1.address, 1000);
      await expect(
        token.connect(addr1).burn(addr1.address, 400)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      await token.mint(owner.address, 1000);
      await token.transfer(addr1.address, 300);
      expect(await token.balanceOf(addr1.address)).to.equal(300);
      expect(await token.balanceOf(owner.address)).to.equal(700);
    });

    it("Should revert if sender has insufficient balance", async function () {
      await expect(
        token.connect(addr1).transfer(addr2.address, 100)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
  });

  describe("Approve and Allowance", function () {
    it("Should approve and reflect correct allowance", async function () {
      await token.mint(owner.address, 1000);
      await token.approve(addr1.address, 500);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(500);
    });

    it("Should allow approved spender to transferFrom", async function () {
      await token.mint(owner.address, 1000);
      await token.approve(addr1.address, 500);
      await token.connect(addr1).transferFrom(owner.address, addr2.address, 300);
      expect(await token.balanceOf(addr2.address)).to.equal(300);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(200);
    });
  });
});