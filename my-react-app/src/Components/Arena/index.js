import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import myEpicGame from '../../utils/MyEpicGame.json';
import './Arena.css';

const Arena = ({ characterNFT, setCharacterNFT }) => {
  const [gameContract, setGameContract] = useState(null);
  const [boss, setBoss] = useState(null);
  const [attackState, setAttackState] = useState('');
  
  const runAttackAction = async () => {
    try {
      if (gameContract) {
        setAttackState('attacking');
        console.log('attacking boss...');
        const attackTxn = await gameContract.attackBoss();
        await attackTxn.wait();
        console.log("attackTxn ", attackTxn);
        setAttackState('Hit');
        
      }
    } catch (error) {
      console.error("Error attacking boss: ", error);
      setAttackState('');
    }
  };

  useEffect(() => {
    const { ethereum } = window;

    const fetchBoss = async () => {
      const bossTxn = await gameContract.getBigBoss();
      console.log("Got the boss, boss", bossTxn);
      setBoss(transformCharacterData(bossTxn));
    }

    const onAttackComplete = async (from, newBossHp, newPlayerHp) => {
      const bossHp = newBossHp.toNumber();
      const playerHp = newPlayerHp.toNumber();
      const sender = from.toString();

      console.log("fku", ethereum, sender.toLowerCase());
      if (ethereum === sender.toLowerCase()) {
        setBoss((prevState) => {
          return {...prevState, hp: bossHp};
        });
        setCharacterNFT((prevState) => {
          return {...prevState, hp: playerHp};
        });
      } else {
        setBoss((prevState) => {
          return {...prevState, hp: bossHp};
        });
      }
    }
    
    if (gameContract) {
      fetchBoss();
      gameContract.on('AttackComplete', onAttackComplete);
    }
  }, [gameContract]);
  
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
      console.log("Ethereum object not found");
    }
  }, []);

  return (
    <div className='arena-container'>
      {boss && (
        <div className='boss-container'>
          <div className={`boss-content ${attackState}`}>
            <h2> {boss.name} </h2>
            <div className='image-content'>
              <img src={boss.imageURI} alt={`Boss ${boss.name}`} />
              <div className='health-bar'>
                <progress value={boss.hp} max={boss.maxHp} />
                <p>{`${boss.hp} / ${boss.maxHp} HP`} </p>
              </div>
            </div>
          </div>
          <div className='attack-container'>
            <button className='cta-button' onClick={runAttackAction}>
              {`Attack ${boss.name}`}
            </button>
          </div>
        </div>
      )}
      {characterNFT && (
        <div className='players-container'>
          <div className='player-container'>
            <h2>Your Character</h2>
            <div className='player'>
              <div className='image-content'>
                <h2>{characterNFT.name}</h2>
                <img src={characterNFT.imageURI} alt={`character ${characterNFT.name} `}/>
                <div className='health-bar'>
                  <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                  <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
                </div>
              </div>
              <div className='stats'>
                <h4>{`Attack dmg: ${characterNFT.ad}`}</h4>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Arena;