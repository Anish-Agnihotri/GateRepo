import db from "prisma/db"; // DB

// Types
import { Gate } from "@prisma/client";
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
