const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe
          let deployer
          let mockV3Aggregator
          let fundMeAddress
          const { get } = deployments
          const sendValue = ethers.parseEther("1")
          beforeEach(async () => {
              await deployments.fixture(["all"])
              deployer = (await getNamedAccounts()).deployer
              fundMeAddress = (await get("FundMe")).address
              const mockV3AggregatorAddress = (await get("MockV3Aggregator")).address
              const deployerSigner = await ethers.getSigner(deployer)
              fundMe = await ethers.getContractAt("FundMe", fundMeAddress, deployerSigner)
              mockV3Aggregator = await ethers.getContractAt(
                  "MockV3Aggregator",
                  mockV3AggregatorAddress,
                  deployerSigner,
              )
          })

          describe("constructor", () => {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  const mockV3AggregatorAddress = await mockV3Aggregator.getAddress()
                  assert.equal(response, mockV3AggregatorAddress)
              })
          })

          describe("fund", () => {
              it("Fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!")
              })
              it("Updated the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(deployer)
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of getFunder", async () => {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single founder", async () => {
                  //Arrange
                  const startingFundMeBalance = await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance = await ethers.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const endingFundMeBalance = await ethers.provider.getBalance(fundMeAddress)
                  const endingDeployerBalance = await ethers.provider.getBalance(deployer)

                  //gasCost
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  //Assert
                  assert.equal(endingFundMeBalance.toString(), "0")
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost, //Equal initial and final funds
                  )
              })
              it("Withdraw ETH from a single founder use by cheaperWithdraw", async function () {
                  //Arrange
                  const startingFundMeBalance = await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance = await ethers.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const endingFundMeBalance = await ethers.provider.getBalance(fundMeAddress)
                  const endingDeployerBalance = await ethers.provider.getBalance(deployer)

                  //gasCost
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  //Assert
                  assert.equal(endingFundMeBalance, "0")
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost,
                  )
              })
              it("allows us to withdraw with multiple getFunder", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(accounts[i]) //initial contract doesn't be effected
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance = await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance = await ethers.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.withdraw() //only owner can withdraw
                  const transactionReceipt = await transactionResponse.wait(1)
                  const endingFundMeBalance = await ethers.provider.getBalance(fundMeAddress)
                  const endingDeployerBalance = await ethers.provider.getBalance(deployer)

                  //gasCost
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  //Assert
                  assert.equal(endingFundMeBalance, "0")
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost,
                  )

                  //Make sure that the getFunder are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted //new getFunder array

                  for (i = 1; i < 6; i++) {
                      assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(attacker)
                  await expect(attackerConnectedContract.withdraw()).to.be.revertedWithCustomError(
                      fundMe,
                      "FuneMe_NotOwner",
                  )
              })
              it("cheaperWithdraw testing...", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(accounts[i])
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance = await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance = await ethers.provider.getBalance(deployer)
                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw() //only owner can withdraw
                  const transactionReceipt = await transactionResponse.wait(1)
                  const endingFundMeBalance = await ethers.provider.getBalance(fundMeAddress)
                  const endingDeployerBalance = await ethers.provider.getBalance(deployer)

                  //gasCost
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  //Assert
                  assert.equal(endingFundMeBalance, "0")
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost,
                  )

                  //Make sure that the getFunder are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted //new getFunder array

                  for (i = 1; i < 6; i++) {
                      assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
                  }
              })
          })
      })
