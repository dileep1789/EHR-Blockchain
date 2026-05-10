const hre = require("hardhat");
const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const testAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  console.log("--- Blockchain Debug Info ---");
  console.log("Contract Address:", contractAddress);
  console.log("RPC URL:", rpcUrl);
  console.log("Test Address:", testAddress);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  
  try {
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      console.error("❌ ERROR: No contract code found at this address on this network!");
      return;
    }
    console.log("✅ Contract code found at address.");

    const abi = [
      "function hospitalBalance(address) view returns (uint256)"
    ];
    const contract = new ethers.Contract(contractAddress, abi, provider);

    console.log("🔍 Fetching hospitalBalance for:", testAddress);
    const balance = await contract.hospitalBalance(testAddress);
    console.log("✅ Success! Balance:", ethers.utils.formatEther(balance), "POL");

  } catch (error) {
    console.error("❌ ERROR during contract interaction:");
    console.error(error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
