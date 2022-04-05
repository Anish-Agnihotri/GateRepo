import db from "prisma/db"; // DB
import { getSession } from "next-auth/react"; // Auth
import { getRepo } from "pages/api/github/repo"; // Repo
import { isValidAddress } from "pages/repo/create/[owner]/[repo]"; // Validation

// Types
import type { Repo } from "pages/api/github/repos";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Create new gated repository
 * @param {string} userId user
 * @param {string} owner of repository
 * @param {string} repo name
 * @param {string} contract address
 * @param {number} numTokens count
 * @param {number} numInvites count
 * @returns {Promise<string>} gated repository id
 */
const createGatedRepo = async (
  userId: string,
  owner: string,
  repo: string,
  contract: string,
  numTokens: number,
  numInvites: number
): Promise<string> => {
  // Check if you have permission to repo
  const repository: Repo = await getRepo(userId, owner, repo);
  if (!repository) throw new Error("No access to repository.");

  const { id }: { id: string } = await db.gate.create({
    data: {
      repoOwner: owner,
      repoName: repo,
      contract,
      numTokens,
      numInvites,
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
  }

  // Collect body params and check for non-empty
  const {
    owner,
    repo,
    contract,
    tokens,
    invites,
  }: {
    owner: string;
    repo: string;
    contract: string;
    tokens: number;
    invites: number;
  } = req.body;
  if (!owner || !repo || !isValidAddress(contract) || !tokens || !invites) {
    res.status(500).send({ error: "Missing parameters." });
  }

  try {
    // Create new gated repo
    const gateId: string = await createGatedRepo(
      session?.user.id ?? "",
      owner,
      repo,
      contract,
      tokens,
      invites
    );
    res.status(200).send({ id: gateId });
  } catch (e) {
    // Else, return error
    res.status(500).send({ error: String(e) });
  }
};
