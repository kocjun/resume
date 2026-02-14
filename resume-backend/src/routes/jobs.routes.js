import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import * as jobsController from '../controllers/jobs.controller.js';

export default async function jobsRoutes(app) {
  app.addHook('onRequest', optionalAuthenticate);

  app.get('/search', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          skills: { type: 'string', description: 'Comma-separated skill keywords' },
        },
      },
    },
    handler: jobsController.searchJobs,
  });
}
