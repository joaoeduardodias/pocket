import dayjs from 'dayjs'
import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { goalCompletions, goals } from '../db/schema'

interface CreateGoalCompletionRequest {
  goalId: string
}
const firstDayOfWeek = dayjs().startOf('week').toDate()
const lastDayOffWeek = dayjs().endOf('week').toDate()
export async function createGoalCompletion({
  goalId,
}: CreateGoalCompletionRequest) {
  const goalCompletionsCounts = db.$with('goal_completions_counts').as(
    db
      .select({
        goalId: goalCompletions.goalId,
        completionCount: count(goalCompletions.id).as('completionCount'),
      })
      .from(goalCompletions)
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastDayOffWeek),
          eq(goalCompletions.goalId, goalId)
        )
      )
      .groupBy(goalCompletions.goalId)
  )

  const result = await db
    .with(goalCompletionsCounts)
    .select({
      desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
      completionCount: sql`
      COALESCE(${goalCompletionsCounts.completionCount}, 0)`.mapWith(Number),
    })
    .from(goals)
    .leftJoin(goalCompletionsCounts, eq(goalCompletionsCounts.goalId, goals.id))
    .where(eq(goals.id, goalId))
    .limit(1)

  const { completionCount, desiredWeeklyFrequency } = result[0]
  console.log(completionCount)

  if (completionCount >= desiredWeeklyFrequency) {
    throw new Error('Goal already  completed this week!')
  }
  const insertResult = await db
    .insert(goalCompletions)
    .values({ goalId })
    .returning()
  const goalCompletion = insertResult[0]

  return {
    goalCompletion,
  }
}
