const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying StylusArena contract...");

  const StylusArena = await hre.ethers.getContractFactory("StylusArena");
  const stylusArena = await StylusArena.deploy();

  await stylusArena.waitForDeployment();

  const address = await stylusArena.getAddress();
  console.log("\n✅ StylusArena deployed to:", address);
  console.log("Network:", hre.network.name);
  
  // Save to .env file
  const envPath = path.join(__dirname, "../.env");
  const envLocalPath = path.join(__dirname, "../../frontend/.env.local");
  
  const envContent = `CONTRACT_ADDRESS=${address}\nNETWORK=${hre.network.name}\n`;
  
  // Write to contracts/.env
  fs.writeFileSync(envPath, envContent);
  console.log("✅ Saved to contracts/.env");
  
  // Update frontend/.env.local
  const frontendEnvContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}\n`;
  try {
    // Check if file exists, if not create it
    if (!fs.existsSync(envLocalPath)) {
      fs.writeFileSync(envLocalPath, frontendEnvContent);
      console.log("✅ Created frontend/.env.local");
    } else {
      // Check if already exists
      const existingContent = fs.readFileSync(envLocalPath, 'utf8');
      if (existingContent.includes('NEXT_PUBLIC_CONTRACT_ADDRESS')) {
        // Replace existing
        const updated = existingContent.replace(
          /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
          `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`
        );
        fs.writeFileSync(envLocalPath, updated);
        console.log("✅ Updated frontend/.env.local");
      } else {
        fs.appendFileSync(envLocalPath, frontendEnvContent);
        console.log("✅ Appended to frontend/.env.local");
      }
    }
  } catch (err) {
    console.log("⚠️  Could not write to frontend/.env.local");
    console.log("   Please add manually: NEXT_PUBLIC_CONTRACT_ADDRESS=" + address);
  }

  // Save deployment info
  const deploymentInfo = {
    address,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
  };
  
  const deploymentPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Saved deployment info to deployment.json");
  
  console.log("\n📝 Next steps:");
  console.log("1. Update frontend/lib/contracts.ts with the contract address");
  console.log("2. Verify contract on Arbiscan (if on testnet/mainnet)");
  console.log("3. Test contract functions from frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

