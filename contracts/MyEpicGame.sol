// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

import "./libraries/Base64.sol";


contract MyEpicGame is ERC721 {
  
  struct CharacterAttributes {
    uint characterIndex;
    string name;
    string imageURI;
    uint hp;
    uint maxHp;
    uint ad;
  }

  struct BigBoss {
    string name;
    string imageURI;
    uint hp;
    uint maxHp;
    uint ad;
  }

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  CharacterAttributes[] defaultCharacters;
  BigBoss public bigBoss;

  mapping(address => uint256) public nftHolders;

  mapping(uint256 => CharacterAttributes) public nftHolderAttributes;

  uint randNonce = 0;

  event CharacterNFTMinted(address sender, uint256 tokenId, uint256 characterIndex);
  event AttackComplete(address sender, uint256 newBossHp, uint256 newPlayerHp);
  event RevivalComplete(address sender, uint256 newResetHp);
  
  constructor(
    string[] memory characterNames,
    string[] memory characterImageURIs,
    uint[] memory characterHp,
    uint[] memory characterAd,
    string memory bossName,
    string memory bossImageURI,
    uint bossHP,
    uint bossAd
  ) 
    ERC721("Heroes", "Hero") 
  {
    for (uint i=0; i<characterNames.length; i++) {
      defaultCharacters.push(CharacterAttributes({
        characterIndex: i,
        name: characterNames[i],
        imageURI: characterImageURIs[i],
        hp: characterHp[i],
        maxHp: characterHp[i],
        ad: characterAd[i]
      }));

      CharacterAttributes memory c = defaultCharacters[i];
      console.log("Done initializing %s w/ HP %s, img %s", c.name, c.hp, c.imageURI);
    }
    console.log("THIS IS MY GAME CONTRACT. NICE.");

    _tokenIds.increment();

    bigBoss = BigBoss({
      name: bossName,
      imageURI: bossImageURI,
      hp: bossHP,
      maxHp: bossHP,
      ad: bossAd
    });

    console.log("Done initializing boss %s w/ HP %s, img %s", bigBoss.name, bigBoss.hp, bigBoss.imageURI);

  }

  function mintCharacterNFT(uint _characterIndex) external {
    uint256 newItemId = _tokenIds.current();
    _safeMint(msg.sender, newItemId);

    nftHolderAttributes[newItemId] = CharacterAttributes({
      characterIndex: _characterIndex,
      name: defaultCharacters[_characterIndex].name,
      imageURI: defaultCharacters[_characterIndex].imageURI,
      hp: defaultCharacters[_characterIndex].hp,
      maxHp: defaultCharacters[_characterIndex].maxHp,
      ad: defaultCharacters[_characterIndex].ad
    });

    console.log("Minted NFT w/ tokenId %s and characterIndex %s", newItemId, _characterIndex);
    
    nftHolders[msg.sender] = newItemId;

    _tokenIds.increment();
    emit CharacterNFTMinted(msg.sender, newItemId, _characterIndex);
  }

  function tokenURI(uint256 _tokenId) public view override returns (string memory) {
    CharacterAttributes memory charAttributes = nftHolderAttributes[_tokenId];

    string memory strHp = Strings.toString(charAttributes.hp);
    string memory strMaxHp = Strings.toString(charAttributes.maxHp);
    string memory strAttackDamage = Strings.toString(charAttributes.ad);

    string memory json = Base64.encode(
      abi.encodePacked(
        '{"name": "',
        charAttributes.name,
        ' -- NFT #: ',
        Strings.toString(_tokenId),
        '", "description": "This is an NFT that lets people play in the game Metaverse Slayer!", "image": "',
        charAttributes.imageURI,
        '", "attributes": [ { "trait_type": "Health Points", "value": ',strHp,', "max_value":',strMaxHp,'}, { "trait_type": "Attack Damage", "value": ',
        strAttackDamage,'} ]}'
      )
    );

    string memory output = string(
      abi.encodePacked("data:application/json;base64,", json)
    );
    
    return output;
  }

  function attackBoss() public {
    uint256 nftTokenIdOfPlayer = nftHolders[msg.sender];
    CharacterAttributes storage player = nftHolderAttributes[nftTokenIdOfPlayer];
    console.log("\nPlayer w/ character %s about to attack. Has %s HP and %s AD", player.name, player.hp, player.ad);
    console.log("Boss %s has %s HP and %s AD", bigBoss.name, bigBoss.hp, bigBoss.ad);
    require(player.hp > 0, "Hate to bring it to you but it looks like your character is dead homie.");

    require(bigBoss.hp > 0, "STOP! ITS ALREADY DEAD YOU MONSTER.");

    console.log("%s swings at %s...", player.name, bigBoss.name); 

    if (bigBoss.hp < player.ad) {
      bigBoss.hp = 0;
      console.log("The boss is dead!");
    } else {
      if (randomInt(10) > 0) {                                 // by passing 10 as the mod, we elect to only grab the last digit (0-9) of the hash!
          bigBoss.hp = bigBoss.hp - player.ad;
          console.log("%s attacked boss. New boss hp: %s", player.name, bigBoss.hp);
      } else {
          console.log("%s missed!\n", player.name);
      }
    }

    if (player.hp < bigBoss.ad) {
      player.hp = 0;
      console.log("Rip in peace player. You will not be remembered");
    } else {
      if (randomInt(10) > 0) {
        player.hp = player.hp - bigBoss.ad;
        console.log("%s attacked you! Your new hp is: %s", bigBoss.name, player.hp);
      } else {
        console.log("%s missed! Now is your chance to strike back!", bigBoss.name);
      }
    }
    emit AttackComplete(msg.sender, bigBoss.hp, player.hp);
  }

  function reviveCharacterNFT() public {
    uint256 nftTokenIdOfPlayer = nftHolders[msg.sender];
    CharacterAttributes storage player = nftHolderAttributes[nftTokenIdOfPlayer];

    console.log("\nAttempting to revive character %s ", player.name);
    require(player.hp == 0, "Bro you can't revive your character if its not dead.");

    player.hp = player.maxHp;
    console.log("Players hp is set back to %s", player.hp);

    emit RevivalComplete(msg.sender, player.maxHp);

  }

  function randomInt(uint _modulus) internal returns(uint) {
    randNonce++;
    return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))) % _modulus;
  }

  function checkIfUserHasNFT() public view returns (CharacterAttributes memory) {
    // Get the tokenId of the user's character NFT
    uint256 userNftTokenId = nftHolders[msg.sender];
    // If the user has a tokenId in the map, return their character.
    if (userNftTokenId > 0) {
      return nftHolderAttributes[userNftTokenId];
    }
    // Else, return an empty character.
    else {
      CharacterAttributes memory emptyStruct;
      return emptyStruct;
    }
  }

  function getAllDefaultCharacters() public view returns (CharacterAttributes[] memory) {
    return defaultCharacters;
  }

  function getBigBoss() public view returns (BigBoss memory) {
    return bigBoss;
  }

}