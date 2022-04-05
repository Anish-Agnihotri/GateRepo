import db from "prisma/db"; // DB
import { getSession } from "next-auth/react"; // Auth
import { recoverPersonalSignature } from "eth-sig-util"; // Utils: Ethereum signature verification

// Types
import type { Gate } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
export type GateExtended = Gate & { creator: { name: string | null } };

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
  }: { address: string; signature: string; gateId: string } = req.body;
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
};
