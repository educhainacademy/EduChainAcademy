const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const ALCHEMY_RPC_BASE = "https://eth-sepolia.g.alchemy.com/v2";
const ALCHEMY_API_BASE = "https://api.g.alchemy.com";

function rpcUrl(chain: string = "eth-sepolia"): string {
  const network = chain === "polygon-amoy" ? "polygon-amoy" : "eth-sepolia";
  return `${ALCHEMY_RPC_BASE.replace("eth-sepolia", network)}/${ALCHEMY_API_KEY}`;
}

function apiUrl(path: string): string {
  return `${ALCHEMY_API_BASE}${path}/${ALCHEMY_API_KEY}`;
}

export interface TokenPrice {
  symbol: string;
  name: string;
  network: string;
  address: string;
  price: number;
  change24h: number;
}

export interface NFTMetadata {
  contractAddress: string;
  tokenId: string;
  name: string;
  image: string;
  description: string;
  attributes: { trait_type: string; value: string | number }[];
}

export interface PortfolioAsset {
  address: string;
  balance: string;
  balanceUSD: number;
  price: number;
  change24h: number;
}

export async function getTokenPrices(symbols: string[]): Promise<TokenPrice[]> {
  if (!ALCHEMY_API_KEY || symbols.length === 0) return [];

  const params = symbols.map((s) => `symbols=${s}`).join("&");
  const res = await fetch(`${apiUrl("/prices/v1")}/tokens/by-symbol?${params}`);

  if (!res.ok) return [];
  const data = await res.json();
  return data.data?.prices ?? [];
}

export async function getTokenPricesByAddress(
  addresses: { address: string; network: string }[]
): Promise<TokenPrice[]> {
  if (!ALCHEMY_API_KEY || addresses.length === 0) return [];

  const res = await fetch(`${apiUrl("/prices/v1")}/tokens/by-address`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokens: addresses }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.data?.prices ?? [];
}

export async function getNFTMetadata(
  contractAddress: string,
  tokenId: string
): Promise<NFTMetadata | null> {
  if (!ALCHEMY_API_KEY) return null;

  const res = await fetch(
    `${apiUrl("/nft/v3")}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}&withMetadata=true`
  );

  if (!res.ok) return null;
  const data = await res.json();
  const nft = data.nft;
  if (!nft) return null;

  return {
    contractAddress,
    tokenId,
    name: nft.name || `#${tokenId}`,
    image: nft.image?.cachedUrl || nft.image?.originalUrl || "",
    description: nft.description || "",
    attributes: nft.raw?.metadata?.attributes || [],
  };
}

export async function getNFTsForOwner(
  owner: string,
  contractAddresses?: string[]
): Promise<NFTMetadata[]> {
  if (!ALCHEMY_API_KEY) return [];

  let url = `${apiUrl("/nft/v3")}/getNFTsForOwner?owner=${owner}&withMetadata=true&pageSize=50`;
  if (contractAddresses?.length) {
    contractAddresses.forEach((addr) => {
      url += `&contractAddresses[]=${addr}`;
    });
  }

  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();

  return (data.ownedNfts || []).map((nft: any) => ({
    contractAddress: nft.contract?.address || "",
    tokenId: nft.tokenId || "0",
    name: nft.name || `#${nft.tokenId}`,
    image: nft.image?.cachedUrl || nft.image?.originalUrl || "",
    description: nft.description || "",
    attributes: nft.raw?.metadata?.attributes || [],
  }));
}

export async function getWalletPortfolio(addresses: string[]): Promise<PortfolioAsset[]> {
  if (!ALCHEMY_API_KEY || addresses.length === 0) return [];

  const res = await fetch(`${apiUrl("/data/v1")}/assets/tokens/balances/by-address`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      addresses: addresses.map((address) => ({
        address,
        networks: ["eth-mainnet", "base-mainnet"],
      })),
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();

  const assets: PortfolioAsset[] = [];
  for (const wallet of data.data?.balances || []) {
    for (const token of wallet.tokenBalances || []) {
      assets.push({
        address: token.contractAddress || "",
        balance: token.balance || "0",
        balanceUSD: token.tokenBalanceUSD || 0,
        price: token.tokenPrice || 0,
        change24h: token.priceChange?.percentage || 0,
      });
    }
  }
  return assets;
}

export async function getERC20Balances(
  address: string,
  contractAddresses: string[]
): Promise<{ contractAddress: string; balance: string }[]> {
  if (!ALCHEMY_API_KEY || !address) return [];

  const res = await fetch(rpcUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getTokenBalances",
      params: [address, contractAddresses],
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();

  return (data.result?.balances || []).map((b: any) => ({
    contractAddress: b.contractAddress,
    balance: BigInt(b.tokenBalance).toString(),
  }));
}
