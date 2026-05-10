const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not found in .env");
    return;
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Authorizing relayer using account:", deployer.address);

  const EHRRegistry = await hre.ethers.getContractFactory("EHRRegistry");
  const ehrRegistry = await EHRRegistry.attach(contractAddress);

  // Authorize the deployer (Account #0) as a relayer
  const tx = await ehrRegistry.addRelayer(deployer.address);
  await tx.wait();

  console.log("✅ Relayer authorized successfully!");
  
  // Also check if deployer is authorized provider
  const isProvider = await ehrRegistry.authorizedProviders(deployer.address);
  if (!isProvider) {
    console.log("📝 Authorizing deployer as provider too...");
    const tx2 = await ehrRegistry.addProvider(deployer.address);
    await tx2.wait();
    console.log("✅ Provider authorized successfully!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
