import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenA, TokenB, SimpleDEX } from "../typechain-types";

describe("Smart Contracts Deployment", function () {
  let tokenA: TokenA;
  let tokenB: TokenB;
  let simpleDEX: SimpleDEX;
  let owner: any;
  let randomUser: any;

  before(async function() {
    // Get signers for testing
    [owner, randomUser] = await ethers.getSigners();
  });

  describe("TokenA Deployment", function () {
    it("Should deploy TokenA contract", async function () {
      const TokenAFactory = await ethers.getContractFactory("TokenA");
      tokenA = await TokenAFactory.deploy() as TokenA;
      await tokenA.waitForDeployment();

      expect(await tokenA.getAddress()).to.be.properAddress;
    });

    it("Should have correct token details", async function () {
      expect(await tokenA.name()).to.equal("TokenA");
      expect(await tokenA.symbol()).to.equal("TKA");
    });

    it("Should mint initial supply to deployer", async function () {
      const decimals = await tokenA.decimals();
      const initialSupply = 1_000_000n * 10n ** BigInt(decimals);
      const ownerBalance = await tokenA.balanceOf(owner.address);
      
      expect(await tokenA.totalSupply()).to.equal(initialSupply);
      expect(ownerBalance).to.equal(initialSupply);
    });
  });

  describe("TokenB Deployment", function () {
    it("Should deploy TokenB contract", async function () {
      const TokenBFactory = await ethers.getContractFactory("TokenB");
      tokenB = await TokenBFactory.deploy() as TokenB;
      await tokenB.waitForDeployment();

      expect(await tokenB.getAddress()).to.be.properAddress;
    });

    it("Should have correct token details", async function () {
      expect(await tokenB.name()).to.equal("TokenB");
      expect(await tokenB.symbol()).to.equal("TKB");
    });

    it("Should mint initial supply to deployer", async function () {
      const decimals = await tokenB.decimals();
      const initialSupply = 1_000_000n * 10n ** BigInt(decimals);
      const ownerBalance = await tokenB.balanceOf(owner.address);
      
      expect(await tokenB.totalSupply()).to.equal(initialSupply);
      expect(ownerBalance).to.equal(initialSupply);
    });
  });

  describe("SimpleDEX Deployment", function () {
    it("Should deploy SimpleDEX with valid token addresses", async function () {
      const SimpleDEXFactory = await ethers.getContractFactory("SimpleDEX");
      simpleDEX = await SimpleDEXFactory.deploy(
        await tokenA.getAddress(), 
        await tokenB.getAddress()
      ) as SimpleDEX;
      await simpleDEX.waitForDeployment();

      expect(await simpleDEX.getAddress()).to.be.properAddress;
    });

    it("Should have correct token addresses", async function () {
      expect(await simpleDEX.tokenA()).to.equal(await tokenA.getAddress());
      expect(await simpleDEX.tokenB()).to.equal(await tokenB.getAddress());
    });

    it("Should set the deployer as the owner", async function () {
      const contractOwner = await simpleDEX.owner();
      expect(contractOwner).to.equal(owner.address);
    });

    it("Should prevent deploying with same token addresses", async function () {
      const SimpleDEXFactory = await ethers.getContractFactory("SimpleDEX");
      await expect(
        SimpleDEXFactory.deploy(
          await tokenA.getAddress(), 
          await tokenA.getAddress()
        )
      ).to.be.revertedWith("Token addresses must differ");
    });
  });

  describe("Access Control", function () {
    it("Should prevent non-owner from adding liquidity", async function () {
      // Ensure tokens are minted for the random user
      const amountA = ethers.parseUnits("10", 18);
      const amountB = ethers.parseUnits("10", 18);

      // Transfer tokens to random user
      await tokenA.transfer(randomUser.address, amountA);
      await tokenB.transfer(randomUser.address, amountB);

      // Approve tokens for the DEX
      await tokenA.connect(randomUser).approve(await simpleDEX.getAddress(), amountA);
      await tokenB.connect(randomUser).approve(await simpleDEX.getAddress(), amountB);

      // Try to add liquidity as a non-owner
      await expect(
        simpleDEX.connect(randomUser).addLiquidity(amountA, amountB)
      ).to.be.revertedWith("Not the contract owner");
    });

    it("Should prevent non-owner from removing liquidity", async function () {
      const amountA = ethers.parseUnits("5", 18);
      const amountB = ethers.parseUnits("5", 18);

      // Try to remove liquidity as a non-owner
      await expect(
        simpleDEX.connect(randomUser).removeLiquidity(amountA, amountB)
      ).to.be.revertedWith("Not the contract owner");
    });
  });
});