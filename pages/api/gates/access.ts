import db from "prisma/db"; // DB

// Types
import { Gate } from "@prisma/client";

/**
 * Get gate from DB
 * @param {string} gateId to collect
 * @returns {Promise<Gate | null>} gate, if exists, or null
 */
export const getGate = async (gateId: string): Promise<Gate | null> => {
  return await db.gate.findUnique({
    where: {
      id: gateId,
    },
  });
};
