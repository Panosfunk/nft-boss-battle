import React, { useEffect, useState } from 'react';
import './SelectCharacter.css';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import myEpicGame from '../../utils/MyEpicGame.json';

const SelectCharacter = ({ setCharacterNFT }) => {
  const [characters, setCharacters] = useState([]);
  const [gameContract, setGameContract] = useState(null);
  const [mintingCharacter, setMintingCharacter] = useState(false);

  const renderCharacters = () => 
    characters.map((character, index) => (
      <div className='character-item' key={character.name}>
        <div className='name-container'>
          <p>{character.name}</p>
        </div>
        <img src={character.imageURI} alt={character.name} styles={{ width: '2%', height:'2%' }}/>
        <button type='button' className='character-mint-button' onClick={() => mintCharacterNFTAction(index)}>
          {`Mint ${character.name}`}
        </button>
      </div>
    ));

  const mintCharacterNFTAction = async (characterId) => {
    try {
      if (gameContract) {
        setMintingCharacter(true);
        console.log("Miiiiint...");
        const mintTxn = await gameContract.mintCharacterNFT(characterId);
        await mintTxn.wait();
        console.log("mint NFT: ", mintTxn);
        setMintingCharacter(false);
      }
    } catch (error) {
      console.warn("MintCharacterNFT error: ", error);
    }
    setMintingCharacter(false);
  };
  
  useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();  
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );
      setGameContract(gameContract);
    } else {
      console.log("Ethereum object not found homziez");
    }
  }, []);

  useEffect(() => {
    const getCharacters = async () => {
      try {
        console.log("Getting contract characters to mint");
        
        const charactersTxn = await gameContract.getAllDefaultCharacters();
        console.log("CharactersTxv", charactersTxn);

        const characters = charactersTxn.map((characterData => transformCharacterData(characterData)));

        setCharacters(characters);
      } catch (error) {
        console.error("something went wrong with fetching the characters", error);
      }
    }

    const onCharacterMint = async (sender, tokenId, characterIndex) => {
      console.log(
        `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
      );
      if (gameContract) {
        const characterNFT = await gameContract.checkIfUserHasNFT();
        console.log(
          `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
        );
      }
    }
    
    if (gameContract) {
      getCharacters();
  
      /*
       * Setup NFT Minted Listener
       */
      gameContract.on('CharacterNFTMinted', onCharacterMint);
    }
    return () => {
      if (gameContract) {
        gameContract.off('CharacterNFTMinted', onCharacterMint);
      }
    };
  }, [gameContract]);
  
  return (
    <div className="select-character-container">
      <h2>Mint Your Hero. Choose wisely.</h2>
      {characters.length > 0 && (
        <div className='character-grid'>{renderCharacters()}</div>
      )}
    </div>
  );
};



export default SelectCharacter;