import { type User, prisma, Quest_dependency_mode } from "@server/database"

export async function checkForQuestCompletion(user: User, challengeIds: number[]) {
  const quests = await prisma.quest.findMany({
    where: {
      challenges: { some: { challengeId: { in: challengeIds } } },
      usersCompleted: { none: { keycloakUserId: user.keycloakUserId } },
    },
    include: {
      challenges: {
        include: {
          qrCodes: {
            include: {
              redeems: { where: { redeemerUserId: user.keycloakUserId } },
            },
          },
        },
      },
    },
  });

  for (const quest of quests) {
    const completedCount = quest.challenges.reduce(
      (count, challenge) => challenge.qrCodes.reduce((count, code) => count + code.redeems.length, count),
      0
    );
    const completed =
      quest.dependencyMode === Quest_dependency_mode.AND
        ? completedCount === quest.challenges.length
        : completedCount > 0;

    if (completed) {
      await prisma.quest.update({
        where: { questId: quest.questId },
        data: { usersCompleted: { connect: [{ keycloakUserId: user.keycloakUserId }] } },
      });

      if (quest.points > 0) {
        await prisma.point.create({
          data: {
            value: quest.points,
            redeemerUserId: user.keycloakUserId,
          },
        });
      }
    }
  }
}