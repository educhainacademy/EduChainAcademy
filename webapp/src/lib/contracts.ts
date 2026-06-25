export const CONTRACT_ADDRESSES = {
  sepolia: {
    eduToken: (process.env.NEXT_PUBLIC_EDU_TOKEN_ADDRESS || "") as `0x${string}`,
    gameItem: (process.env.NEXT_PUBLIC_GAME_ITEM_ADDRESS || "") as `0x${string}`,
    gameLogic: (process.env.NEXT_PUBLIC_GAME_LOGIC_ADDRESS || "") as `0x${string}`,
    questManager: (process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS || "") as `0x${string}`,
    staking: (process.env.NEXT_PUBLIC_STAKING_ADDRESS || "") as `0x${string}`,
    governance: (process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || "") as `0x${string}`,
    eduPlatform: (process.env.NEXT_PUBLIC_EDU_PLATFORM_ADDRESS || "") as `0x${string}`,
    simplePaymaster: (process.env.NEXT_PUBLIC_SIMPLE_PAYMASTER_ADDRESS || "") as `0x${string}`,
    membershipNFT: (process.env.NEXT_PUBLIC_MEMBERSHIP_NFT_ADDRESS || "") as `0x${string}`,
  },
  polygonAmoy: {
    eduToken: (process.env.NEXT_PUBLIC_EDU_TOKEN_ADDRESS || "") as `0x${string}`,
    gameItem: (process.env.NEXT_PUBLIC_GAME_ITEM_ADDRESS || "") as `0x${string}`,
    gameLogic: (process.env.NEXT_PUBLIC_GAME_LOGIC_ADDRESS || "") as `0x${string}`,
    questManager: (process.env.NEXT_PUBLIC_QUEST_MANAGER_ADDRESS || "") as `0x${string}`,
    staking: (process.env.NEXT_PUBLIC_STAKING_ADDRESS || "") as `0x${string}`,
    governance: (process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || "") as `0x${string}`,
    eduPlatform: (process.env.NEXT_PUBLIC_EDU_PLATFORM_ADDRESS || "") as `0x${string}`,
    simplePaymaster: (process.env.NEXT_PUBLIC_SIMPLE_PAYMASTER_ADDRESS || "") as `0x${string}`,
    membershipNFT: (process.env.NEXT_PUBLIC_MEMBERSHIP_NFT_ADDRESS || "") as `0x${string}`,
  },
} as const;

const CHAIN_ID_MAP: Record<number, keyof typeof CONTRACT_ADDRESSES> = {
  11155111: "sepolia",
  80002: "polygonAmoy",
};

export function getAddressesForChain(chainId: number | undefined) {
  if (!chainId) return CONTRACT_ADDRESSES.sepolia;
  const key = CHAIN_ID_MAP[chainId] || "sepolia";
  return CONTRACT_ADDRESSES[key];
}
