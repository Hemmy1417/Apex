import { studionet, testnetBradbury } from "genlayer-js/chains";

const NETWORK = (process.env.NEXT_PUBLIC_NETWORK || "studionet").toLowerCase();
export const IS_BRADBURY = NETWORK === "bradbury";
export const CHAIN = IS_BRADBURY ? testnetBradbury : studionet;
export const CHAIN_HEX = ("0x" + CHAIN.id.toString(16)) as `0x${string}`;
export const CHAIN_RPC = CHAIN.rpcUrls.default.http[0];
export const CHAIN_NAME = CHAIN.name;
export const NETWORK_LABEL = IS_BRADBURY ? "Testnet Bradbury" : "Studionet";
export const GAS_SPONSORED = !IS_BRADBURY;

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x08CeEd3e1C88D7666D08828a8d4212e3244A80f6") as `0x${string}`;
export const CONTRACT_CONFIGURED = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);

export const EXPLORER_URL = (
  process.env.NEXT_PUBLIC_EXPLORER_URL ||
  CHAIN.blockExplorers?.default?.url ||
  ""
).replace(/\/$/, "");

export function explorerTxUrl(hash: string): string {
  if (!EXPLORER_URL || !hash) return "";
  return `${EXPLORER_URL.replace(/\/$/, "")}/tx/${hash}`;
}

export const TOP_FLOOR = 6;
export const MAX_HP = 100;
