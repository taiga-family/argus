import { createNodeMiddleware, createProbot } from 'probot';

import app from '../../../public/index';

export default createNodeMiddleware(app, {
    probot: createProbot(),
    webhooksPath: '/api/github/webhooks',
});
