import https from 'https';
import { Context } from 'probot';
import { getWorkflowPrNumbers } from '../selectors';

const SLACK_MESSAGE_CHARS_LIMIT = 4000;

/**
 * Look into this {@link https://api.slack.com/messaging/webhooks doc} how to create Incoming Webhooks
 * ___
 * To customize slack message see {@link https://api.slack.com/reference/surfaces/formatting doc}
 * or try this {@link https://app.slack.com/block-kit-builder sandbox}
 */
export class SlackLogger {
    private readonly webhookURL: string = process.env.SLACK_WEBHOOK_URL || '';

    async sendError(step: string, context: Context, error: unknown) {
        if (this.webhookURL) {
            return this.sendPostRequest(
                this.webhookURL,
                this.buildErrorReport(step, context, error)
            );
        }
    }

    private buildErrorReport(
        step: string,
        context: Context,
        error: unknown
    ): object {
        const repoLink = this.ensureRepoLink(context);
        const repoEvent = context?.name || '';
        const prs = this.ensurePRNumber(context);

        const divider = { type: 'divider' };

        return {
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: 'I got an error :x:',
                        emoji: true,
                    },
                },
                divider,
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Step*: ${step}\n*Repository Event*: ${repoEvent}\n*Repository Link*: ${repoLink}\n*Pull Requests*: ${JSON.stringify(
                            prs
                        )}`,
                    },
                },
                divider,
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text:
                            '*Error:*\n```' +
                            JSON.stringify(
                                error,
                                Object.getOwnPropertyNames(error)
                            ).slice(0, SLACK_MESSAGE_CHARS_LIMIT - 1000) +
                            '```',
                    },
                },
            ],
        };
    }

    private async sendPostRequest(url: string, body: object) {
        return new Promise((resolve, reject) => {
            const requestOptions = {
                method: 'POST',
                header: {
                    'Content-Type': 'application/json',
                },
            };

            const req = https.request(url, requestOptions, (res) => {
                let response = '';

                res.on('data', (d) => (response += d));
                res.on('end', () => resolve(response));
            });

            req.on('error', (e) => reject(e));
            req.write(JSON.stringify(body));
            req.end();
        });
    }

    // Typescript-agnostic function: if smth goes wrong and we are here (we should not trust any types)
    private ensurePRNumber(context: Context): number[] {
        try {
            return getWorkflowPrNumbers(
                context as unknown as Context<'workflow_run'>
            );
        } catch {
            return [];
        }
    }

    // Typescript-agnostic function: if smth goes wrong and we are here (we should not trust any types)
    private ensureRepoLink(context: Context): string {
        return (context as unknown as any)?.payload?.repository?.html_url || '';
    }
}
