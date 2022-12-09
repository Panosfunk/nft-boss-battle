const CONTRACT_ADDRESS = '0x3078D55b326C59aC835a9Be237628dBE79B87EaF';

const transformCharacterData = (characterData) => {
  return {
    name: characterData.name,
    imageURI: characterData.imageURI,
    hp: characterData.hp.toNumber(),
    maxHp: characterData.maxHp.toNumber(),
    ad: characterData.ad.toNumber()
  };
};

export { CONTRACT_ADDRESS, transformCharacterData };