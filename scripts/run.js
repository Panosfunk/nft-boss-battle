const main = async () => {
  const gameContractFactory = await hre.ethers.getContractFactory('MyEpicGame');
  const gameContract = await gameContractFactory.deploy(
    ["Leo", "Aang", "Pikachu"],
    ["https://i.imgur.com/pKd5Sdk.png",
    "https://i.imgur.com/xVu4vFL.png",
    "https://i.imgur.com/WMB6g9u.png"],
    [100, 200, 300], 
    [100, 50, 25],
    "Elon Musk",
    "https://i.imgur.com/AksR0tt.png",
    10000,
    50
  );
  await gameContract.deployed();
  console.log("Contract deployed to:", gameContract.address);
  
  let txn;
  // We only have three characters.
  // an NFT w/ the character at index 2 of our array.
  txn = await gameContract.mintCharacterNFT(0);
  await txn.wait();
  
  // Get the value of the NFT's URI.
  let returnedTokenUri = await gameContract.tokenURI(1);
  console.log("Token URI:", returnedTokenUri);

  txn = await gameContract.attackBoss();
  await txn.wait();
  
  txn = await gameContract.attackBoss();
  await txn.wait();

  txn = await gameContract.reviveCharacterNFT();
  await txn.wait();
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();