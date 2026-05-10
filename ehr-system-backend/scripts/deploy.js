const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of EHRRegistry...");

  const EHRRegistry = await hre.ethers.getContractFactory("EHRRegistry");
  const ehrRegistry = await EHRRegistry.deploy();

  await ehrRegistry.deployed();

  console.log("✅ EHRRegistry deployed to:", ehrRegistry.address);
  console.log("📝 Update your .env file with this address!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
