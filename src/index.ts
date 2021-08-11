import { Probot } from "probot";

export = (app: Probot) => {
  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    await context.octokit.issues.createComment(issueComment);

    context.log.info('Code was pushed to the repo, what should we do with it?');
  });

  app.on('issue_comment.created', async context => {
    if (context.isBot) {
      return;
    }

    const issueComment = context.issue({
      body: "Edited!2",
    });
    await context.octokit.issues.createComment(issueComment);

    context.log.info('Code was pushed to the repo, what should we do with it?222');
  });
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
