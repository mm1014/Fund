const { ethers, getNamedAccounts, deployments } = require("hardhat")

async function main() {
    const { get } = deployments
    const { deployer } = await getNamedAccounts()
    const deployerSigner = await ethers.getSigner(deployer)
    const fundMeAddress = (await get("FundMe")).address
    const fundMe = await ethers.getContractAt("FundMe", fundMeAddress, deployerSigner)
    console.log(`Got contract FundMe at ${fundMeAddress}`)
    console.log("Funding contract...")
    const transactionResponse = await fundMe.fund({
        value: ethers.parseEther("0.1"),
    })
    await transactionResponse.wait()
    console.log("Funded!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
