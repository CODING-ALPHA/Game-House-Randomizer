import Participant from "@/models/Participant";

/**
 * Implements balanced randomization:
 * 1. Count participants in each group of a specific game
 * 2. Find groups with the smallest count
 * 3. Randomly choose from tied groups
 */
export async function assignGroup(
  gameId: string,
  availableGroups: string[],
): Promise<string> {
  if (!availableGroups || availableGroups.length === 0) {
    throw new Error("No groups available in this game");
  }

  // Count participants in each group
  const groupCounts = await Promise.all(
    availableGroups.map(async (groupName) => {
      const count = await Participant.countDocuments({ gameId, groupName });
      return { groupName, count };
    }),
  );

  // Find the minimum count
  const minCount = Math.min(...groupCounts.map((gc) => gc.count));

  // Get all groups with the minimum count
  const tiedGroups = groupCounts
    .filter((gc) => gc.count === minCount)
    .map((gc) => gc.groupName);

  // Randomly select from tied groups
  const randomIndex = Math.floor(Math.random() * tiedGroups.length);
  return tiedGroups[randomIndex];
}
