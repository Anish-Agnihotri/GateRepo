import db from "prisma/db"; // DB
import { getSession } from "next-auth/react"; // Auth

// Types
import type { Gate } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Collects all gates created by user
 * @param {string} userId to check
 * @returns {Promise<Gate[]>} all created gates
 */
export const getGatesByUser = async (userId: string): Promise<Gate[]> => {
  return (
    (
      await db.gate.findMany({
        where: {
          creatorId: userId,
        },
      })
    )
      // Filter by unused
      .filter((v) => v.numInvites != v.usedInvites)
      // Sort by block number
      .sort((a, b) => b.blockNumber - a.blockNumber)
  );
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Check authentication
  const session = await getSession({ req });
  if (!session || !session.user.id) {
    res.status(500).send({ error: "Not authenticated." });
    return;
  }

  try {
    // Collect and send gates
    const gates: Gate[] = await getGatesByUser(session?.user.id ?? "");
    res.status(200).send(gates);
  } catch (e) {
    // Else, return error
    res.status(500).send({ error: String(e) });
  }
};
