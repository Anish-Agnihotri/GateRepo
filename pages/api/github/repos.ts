import db from "prisma/db"; // DB
import { Octokit } from "@octokit/rest"; // GitHub
import { getSession } from "next-auth/react"; // Auth

// Types
import type { NextApiRequest, NextApiResponse } from "next";
export type Repo = {
  fullName: string;
  htmlURL: string;
  isOrg: boolean;
};

/**
 * Collects all private repos owned by a user
 * @param {string} userId in database
 * @returns {Promise<Repo[]>} list of owned, private repos
 */
export const getRepos = async (userId: string): Promise<Repo[]> => {
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

  // Loop till all repos collected
  // (GH API enforces max 100 per page with no cursor)
  let lastPage = false;
  let sourceRepos = [];
  for (let i = 0; !lastPage; i++) {
    const { data } = await gh.rest.repos.listForAuthenticatedUser({
      // Only private repos
      visibility: "private",
      // All repo affiliations
      affiliation: "owner,collaborator,organization_member",
      sort: "pushed",
      per_page: 100,
      page: i,
    });
    // Append new repos
    sourceRepos.push(...data);

    // If no more repos, break
    if (data.length == 0) {
      lastPage = true;
    }
  }

  let repos: Repo[] = [];
  let repoExist: Record<string, boolean> = {};
  // Filter repos by admin & non-archive + non-disabled
  for (const repo of sourceRepos) {
    // Filter repos for duplicates
    // Occasionally, GitHub will duplicate API response on creating new repos
    if (repo.full_name in repoExist) {
      continue;
    }
    const isOrg = repo.owner.type === "Organization";

    if (!repo.archived && !repo.disabled && repo.permissions?.admin) {
      repos.push({
        fullName: repo.full_name,
        htmlURL: repo.html_url,
        isOrg,
      });
      // Update duplicates check
      repoExist[repo.full_name] = true;
    }
  }

  return repos;
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Check authentication
  const session = await getSession({ req });
  if (!session || !session.user.id) {
    res.status(500).send({ error: "Not authenticated." });
    return;
  }

  try {
    // Collect and send repos
    const repos: Repo[] = await getRepos(session?.user.id ?? "");
    res.status(200).send(repos);
  } catch (e) {
    // Else, return error
    res.status(500).send({ error: String(e) });
  }
};
