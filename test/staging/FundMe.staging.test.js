const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe
          let deployer
          let fundMeAddress
          const { get } = deployments
          const sendValue = ethers.parseEther("0.02")
          beforeEach(async function () {
              const fundMeAddress = (await get("FundMe")).address
              deployer = (await getNamedAccounts()).deployer
              deployerSigner = await ethers.getSigner(deployer)
              fundMe = await ethers.getContractAt("FundMe", fundMeAddress, deployerSigner)
              fundMeAddress = await fundMe.getAddress()
          })
          it("allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await ethers.provider.getBalance(fundMeAddress)
              assert.equal(endingBalance.toString(), "0")
          })
      })
