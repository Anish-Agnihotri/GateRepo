import db from "prisma/db"; // DB
import { ethers } from "ethers"; // Ethers
import { getSession } from "next-auth/react"; // Auth
import { getRepo } from "pages/api/github/repo"; // Repo
import { isValidAddress } from "pages/repo/create/[owner]/[repo]"; // Validation

// Types
import type { Repo } from "pages/api/github/repos";
import type { NextApiRequest, NextApiResponse } from "next";

// Ethers provider
const provider = new ethers.providers.StaticJsonRpcProvider(
  process.env.RPC_API,
  1
);

/**
 * Collects details about ERC20 token
 * @param {string} contractAddress token
 * @returns {Promise<{ name: string, decimals: number }>} ERC20 name + decimals
 */
const getERC20Details = async (
  contractAddress: string
): Promise<{ name: string; decimals: number }> => {
  // Setup contract
  const contract = new ethers.Contract(
    contractAddress,
    [
      "function name() public view returns (string memory)",
      "function decimals() public view returns (uint8)",
    ],
    provider
  );

  // Get name and decimals
  const name: string = await contract.name();
  const decimals: number = await contract.decimals();
  return { name, decimals };
};

/**
 * Create new gated repository
 * @param {string} userId user
 * @param {string} owner of repository
 * @param {string} repo name
 * @param {string} contract address
 * @param {number} numTokens count
 * @param {number} numInvites count
 * @param {boolean} readOnly permission
 * @returns {Promise<string>} gated repository id
 */
const createGatedRepo = async (
  userId: string,
  owner: string,
  repo: string,
  contract: string,
  numTokens: number,
  numInvites: number,
  readOnly: boolean,
  dynamicCheck: boolean
): Promise<string> => {
  // Check if you have permission to repo
  const repository: Repo = await getRepo(userId, owner, repo);
  if (!repository) throw new Error("No access to repository.");

  // Collect ERC20 details
  const { name, decimals } = await getERC20Details(contract);
  // Collect latest block number to peg balance to
  const blockNumber: number = !dynamicCheck
    ? await provider.getBlockNumber()
    : 0;

  // Create and return gated repo entry
  const { id }: { id: string } = await db.gate.create({
    data: {
      repoOwner: owner,
      repoName: repo,
      blockNumber,
      contract,
      contractName: name,
      contractDecimals: decimals,
      numTokens,
      numInvites,
      readOnly,
      dynamicCheck,
      creator: {
        connect: {
          id: userId,
        },
      },
    },
    select: {
      id: true,
    },
  });
  return id;
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Check authentication
  const session = await getSession({ req });
  if (!session || !session.user.id) {
    res.status(500).send({ error: "Not authenticated." });
    return;
  }

  // Collect body params and check for non-empty
  const {
    owner,
    repo,
    contract,
    tokens,
    invites,
    readOnly,
    dynamicCheck,
  }: {
    owner: string;
    repo: string;
    contract: string;
    tokens: number;
    invites: number;
    readOnly: boolean;
    dynamicCheck: boolean;
  } = req.body;
  if (!owner || !repo || !isValidAddress(contract) || !tokens || !invites) {
    res.status(500).send({ error: "Missing parameters." });
    return;
  }

  try {
    // Create new gated repo
    const gateId: string = await createGatedRepo(
      session?.user.id ?? "",
      owner,
      repo,
      contract,
      tokens,
      invites,
      readOnly,
      dynamicCheck
    );
    res.status(200).send({ id: gateId });
  } catch (e) {
    console.log(e);
    // Else, return error
    res.status(500).send({ error: String(e) });
  }
};
