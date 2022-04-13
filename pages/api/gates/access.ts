import db from "prisma/db"; // DB
import { ethers } from "ethers"; // Ethers
import { Octokit } from "@octokit/rest"; // GitHub
import { getSession } from "next-auth/react"; // Auth
import snapshot from "@snapshot-labs/snapshot.js"; // Snapshot.js
import { recoverPersonalSignature } from "eth-sig-util"; // Utils: Ethereum signature verification

// Types
import type { Gate, User } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
export type GateExtended = Gate & { creator: { name: string | null } };

// Ethers provider
const provider = new ethers.providers.StaticJsonRpcProvider(
  process.env.RPC_API,
  1
);

// Enums
enum Response {
  Exists = 200,
  Unknown = 404,
}

/**
 * Get gate from DB
 * @param {string} gateId to collect
 * @returns {Promise<Gate | null>} gate, if exists, or null
 */
export const getGate = async (gateId: string): Promise<GateExtended | null> => {
  return await db.gate.findUnique({
    where: {
      id: gateId,
    },
    include: {
      creator: {
        select: {
          name: true,
        },
      },
    },
  });
};

/**
 * Collects number of contract tokens held by a user at specific snapshot blocknumber
 * @param {string} userAddress holder
 * @param {string} tokenAddress token contract
 * @param {string} tokenDecimals token decimals
 * @param {number} blockNumber snapshot number
 * @returns {Promise<number>} number of tokens owned
 */
const collectVotesForToken = async (
  userAddress: string,
  tokenAddress: string,
  tokenDecimals: number,
  blockNumber: number
): Promise<number> => {
  // Collect balance of user
  const response = await snapshot.strategies["erc20-balance-of"](
    "Count", // Any space
    // Network
    "1",
    // Ethers provider
    provider,
    // Voters
    [userAddress],
    // Token
    {
      address: tokenAddress,
      symbol: "Query",
      decimals: tokenDecimals,
    },
    // Block number of snapshot
    blockNumber
  );

  // If some token snapshot exists
  if (userAddress in response) {
    // Return token count
    return response[userAddress];
  } else {
    // Else, return 0 tokens
    return 0;
  }
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Check authentication
  const session = await getSession({ req });
  if (!session || !session.user.id) {
    res.status(500).send({ error: "Not authenticated." });
    return;
  }

  // Collect params
  const {
    address, // Ethereum address with tokens
    signature, // Signature verifying Ethereum address ownership
    gateId, // Gated repo ID
    readOnly, // Read-only permission
    dynamicCheck, // Dynamic token check
  }: {
    address: string;
    signature: string;
    gateId: string;
    readOnly: boolean;
    dynamicCheck: boolean;
  } = req.body;
  if (!address || !signature || !gateId) {
    res.status(500).send({ error: "Missing parameters." });
    return;
  }

  // Verify address ownership
  const messageToVerify: string = `GateRepo: Verifying my address is ${address}`;
  const decodedAddress: string = recoverPersonalSignature({
    data: messageToVerify,
    sig: signature,
  });
  if (address.toLowerCase() !== decodedAddress.toLowerCase()) {
    res.status(500).send({ error: "Invalid address verification signature." });
    return;
  }

  // Check if gated repo exists
  const gate = await db.gate.findUnique({
    where: {
      id: gateId,
    },
    include: {
      creator: {
        select: {
          accounts: {
            select: {
              access_token: true,
            },
          },
        },
      },
    },
  });
  if (!gate || !gate.id) {
    res.status(500).send({ error: "Gated repo no longer exists." });
    return;
  }

  // Check if gated repo has available invite space
  const hasEmptyInvites: boolean = gate.numInvites - gate.usedInvites > 0;
  if (!hasEmptyInvites) {
    res.status(500).send({ error: "Gated repo has no more invites." });
    return;
  }

  // Check if address held necessary tokens
  let numTokensHeld: number;

  // If dynamic check is enabled, check at current block
  if (dynamicCheck) {
    const defaultProvider = new ethers.providers.JsonRpcProvider(
      process.env.RPC_API
    );
    const selector = "0x70a08231"; // balanceOf(address)
    const data = selector + ethers.utils.hexZeroPad(address, 32).slice(2);
    numTokensHeld =
      Number(
        await defaultProvider.call({
          to: gate.contract,
          data,
        })
      ) /
      10 ** gate.contractDecimals;
  } else {
    numTokensHeld = await collectVotesForToken(
      address,
      gate.contract,
      gate.contractDecimals,
      gate.blockNumber
    );
  }
  if (gate.numTokens > numTokensHeld) {
    res.status(500).send({ error: "Insufficient token balance." });
    return;
  }

  // Check if user exists
  const user: // User object
  | (User & {
        // + Array of access_tokens from accounts
        accounts: {
          access_token: string | null;
        }[];
      })
    | null = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      accounts: {
        select: {
          access_token: true,
        },
      },
    },
  });
  // Collect access token
  const userAccessToken: string | null | undefined =
    user?.accounts[0].access_token;
  // Run checks
  if (!user || !userAccessToken) {
    res.status(500).send({ error: "Error retrieving GitHub user." });
  }

  // Check if user is already part of repository
  let isExistingUser: boolean = false;
  const gh = new Octokit({ auth: userAccessToken });
  try {
    // Check if user has access to repo
    const { status } = await gh.rest.repos.get({
      owner: gate.repoOwner,
      repo: gate.repoName,
    });
    // If status 200, repo exists
    if (status === Response.Exists) isExistingUser = true;
  } catch (e: any) {
    // Any thrown error implies no access to repo
    // Still, for good measure, we force to false
    if (e?.status && e?.status === Response.Unknown) {
      isExistingUser = false;
    }
  }
  if (isExistingUser) {
    res.status(500).send({ error: "User already has access to private repo." });
    return;
  }

  // Check if owner access token exists
  const ownerAccessToken: string | null | undefined =
    gate.creator.accounts[0].access_token;
  if (!ownerAccessToken) {
    res.status(500).send({ erorr: "Private repo owner no longer exists." });
  }

  // Send invite from owner to user to join repository
  let invitationId: number | null = null;
  try {
    const {
      // Collect username for requesting user (we only store account ID in db)
      data: { login: username },
    }: { data: { login: string } } = await gh.rest.users.getAuthenticated();
    // Configure owner Octokit instance
    const ownerGh = new Octokit({ auth: ownerAccessToken });
    // Create new invite to user from owner
    const {
      data: { id },
    }: { data: { id: number } } = await ownerGh.rest.repos.addCollaborator({
      owner: gate.repoOwner,
      repo: gate.repoName,
      username,
      permission: readOnly ? "pull" : undefined,
    });
    // If invitation id exists, update variable
    if (id) invitationId = id;
  } finally {
    // Check for existance, else throw (no catch via finally)
    if (!invitationId) {
      res
        .status(500)
        .send({ error: "Could not issue invite to join private repo." });
      return;
    }
  }

  // Accept invite from user to join repository
  let acceptInviteSuccess: boolean = false;
  try {
    // Accept invitation by id
    const { status } = await gh.rest.repos.acceptInvitationForAuthenticatedUser(
      {
        invitation_id: invitationId,
      }
    );
    // Confirm status is success
    if (status >= 200 && status <= 299) acceptInviteSuccess = true;
  } finally {
    // Check for success, else throw (no catch via finally)
    if (!acceptInviteSuccess) {
      res
        .status(500)
        .send({ error: "Could not accept invite to join private repo." });
      return;
    }
  }

  /**
   * Increment number of used invites
   * FIXME: Technically, this is exploitable (blocking) assuming two+ users
   * send consecutive requests. Should be an increment at begining of function,
   * a revert in case of a 500, or a kept change if success.
   */
  const { creator, ...rest } = gate;
  const newGate: Gate = await db.gate.update({
    where: {
      id: gateId,
    },
    data: {
      ...rest,
      usedInvites: rest.usedInvites + 1,
    },
  });
  // Ensure increment and return final success
  if (newGate.usedInvites <= gate.usedInvites) {
    res.status(500).send({ error: "Could not burn used invite." });
    return;
  } else {
    // Else, throw final success
    res.status(200).send({ success: true });
    return;
  }
};
