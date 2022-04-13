import db from "prisma/db"; // DB
import { Octokit } from "@octokit/rest"; // GitHub
import { getSession } from "next-auth/react"; // Auth

// Types
import type { Repo } from "pages/api/github/repos";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Collects single private repo
 * @param {string} userId authenticated user
 * @param {string} owner repo owner
 * @param {string} repo repo name
 * @returns {Promise<Repo>} owned, private repo
 */
export const getRepo = async (
  userId: string,
  owner: string,
  repo: string
): Promise<Repo> => {
  // Collect GitHub access token for user
  const user = await db.user.findUnique({
    where: {
      // Select by userId
      id: userId,
    },
    select: {
      accounts: {
        select: {
          // Collect access token
          access_token: true,
        },
      },
    },
  });

  // Throw if no access token in db
  if (!user || !user.accounts[0].access_token) {
    throw new Error("User not found.");
  }

  // Setup Octokit
  const accessToken: string = user.accounts[0].access_token;
  const gh = new Octokit({ auth: accessToken });

  // Get repo
  const { data: repository } = await gh.rest.repos.get({
    owner,
    repo,
  });

  // If no access to repository, throw
  if (!repository || !repository.permissions?.admin) {
    throw new Error("Repo does not exist or no access.");
  }

  const isOrg = repository.owner.type === "Organization";

  return {
    fullName: repository.full_name,
    htmlURL: repository.html_url,
    isOrg,
  };
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Check authentication
  const session = await getSession({ req });
  if (!session || !session.user.id) {
    res.status(500).send({ error: "Not authenticated." });
    return;
  }

  // Collect body params and check for non-empty
  const { owner, repo }: { owner: string; repo: string } = req.body;
  if (!owner || !repo) {
    res.status(500).send({ error: "Missing owner or repo." });
    return;
  }

  try {
    // Collect and send repo
    const repository: Repo = await getRepo(session?.user.id ?? "", owner, repo);
    res.status(200).send(repository);
  } catch (e) {
    // Else, return error
    res.status(500).send({ error: String(e) });
  }
};
