const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const funWithStorage = await deploy("FunWithStorage", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(funWithStorage.address, [])
    }

    log("Logging storage...")
    for (let i = 0; i < 10; i++) {
        log(`Location ${i}: ${await ethers.provider.getStorage(funWithStorage.address, i)}`)
    }

    //The same way
    // const trace = await network.provider.send("debug_traceTransaction", [
    //     funWithStorage.transactionHash,
    // ])
    // for (structLog in trace.structLogs) {
    //     if (trace.structLogs[structLog].op == "SSTORE") {
    //         console.log(trace.structLogs[structLog])
    //     }
    // }
    // const firstelementLocation = ethers.utils.keccak256(
    //     "0x0000000000000000000000000000000000000000000000000000000000000002"
    // )
    // const arrayElement = await ethers.provider.getStorageAt(
    //     funWithStorage.address,
    //     firstelementLocation
    // )
    // log(`Location ${firstelementLocation}: ${arrayElement}`)

    // Can you write a function that finds the storage slot of the arrays and mappings?
    // And then find the data in those slots?
    log("Storage-fun deployed!")
    log("----------------------------------------------------")
}

module.exports.tags = ["storage"]
