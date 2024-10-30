import { type User, prisma, QuestDependencyMode } from "@server/database";

export async function checkForQuestCompletion(user: User, challengeIds: number[]) {
  const quests = await prisma.quest.findMany({
    where: {
      challenges: { some: { challengeId: { in: challengeIds } } },
      usersCompleted: { none: { keycloakUserId: user.keycloakUserId } },
    },
    select: {
      dependencyMode: true,
      points: true,
      questId: true,
      challenges: {
        select: {
          qrCodes: {
            select: {
              redeems: { where: { redeemerUserId: user.keycloakUserId } },
            },
          },
        },
      },
    },
  });

  const queries: Promise<unknown>[] = [];

  for (const quest of quests) {
    let completedCount = 0;
    for (const challenge of quest.challenges) {
      const challengeCompletionCount = challenge.qrCodes.reduce((count, code) => count + code.redeems.length, 0);
      if (challengeCompletionCount > 0) completedCount += 1;
    }
    const completed =
      quest.dependencyMode === QuestDependencyMode.AND
        ? completedCount === quest.challenges.length
        : completedCount > 0;

    if (completed) {
      queries.push(
        prisma.$transaction(async (context) => {
          await context.quest.update({
            where: { questId: quest.questId },
            data: { usersCompleted: { connect: [{ keycloakUserId: user.keycloakUserId }] } },
          });

          if (quest.points > 0) {
            await context.point.create({
              data: {
                value: quest.points,
                redeemerUserId: user.keycloakUserId,
              },
            });
          }
        })
      );
    }
  }

  await Promise.all(queries);
}
