import fastify from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

import fastifyCors from '@fastify/cors'
import { createCompletionRoute } from './routes/create-completions'
import { createGoalRoute } from './routes/create-goal'
import { getPendingGoalsRoute } from './routes/get-pending-goals'
import { getWeekSummaryRoute } from './routes/get-week-summary'

const app = fastify().withTypeProvider<ZodTypeProvider>()
app.register(fastifyCors, {
  origin: '*',
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(getPendingGoalsRoute)
app.register(getWeekSummaryRoute)
app.register(createCompletionRoute)
app.register(createGoalRoute)

app.listen({ host: '0.0.0.0', port: 3333 }).then(() => {
  console.log('HTTP server running on port 3333')
})
