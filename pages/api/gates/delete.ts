import db from "prisma/db"; // DB
import { getSession } from "next-auth/react"; // Auth

// Types
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Deletes a gate
 * @param {string} userId prompting deletion
 * @param {string} gateId to delete
 */
export const deleteGate = async (
  userId: string,
  gateId: string
): Promise<void> => {
  // Check if gate exists
  const gate = await db.gate.findUnique({
    where: {
      id: gateId,
    },
    select: {
      creatorId: true,
    },
  });
  if (!gate || !gate.creatorId) {
    throw new Error("Gate does not exist.");
  }

  // Check if user has deletion privelege
  if (userId !== gate.creatorId) {
    throw new Error("Not authenticated to delete gate.");
  }

  // Delete gate
  await db.gate.delete({
    where: {
      id: gateId,
    },
  });
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Check authentication
  const session = await getSession({ req });
  if (!session || !session.user.id) {
    res.status(500).send({ error: "Not authenticated." });
  }

  // Collect body params and check for non-empty
  const {
    id,
  }: {
    id: string;
  } = req.body;
  if (!id) {
    res.status(500).send({ error: "Missing parameters." });
  }

  try {
    // Delete gate
    await deleteGate(session?.user.id ?? "", id);
    res.status(200).send(true);
  } catch (e) {
    // Else, return error
    res.status(500).send({ error: String(e) });
  }
};
