const { ethers, getNamedAccounts, deployments } = require("hardhat")

async function main() {
    const { get } = deployments
    const { deployer } = await getNamedAccounts()
    const deployerSigner = await ethers.getSigner(deployer)
    const fundMeAddress = (await get("FundMe")).address
    const fundMe = await ethers.getContractAt("FundMe", fundMeAddress, deployerSigner)
    console.log(`Got contract FundMe at ${fundMeAddress}`)
    console.log("Withdrawing from contract...")
    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait(1)
    console.log("Withdrawed!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
