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
  },
} as const;
