# Argus

**Argus** is a bot built with [Probot](https://github.com/probot/probot)
to watch for repository's workflows with tests, download artifacts with screenshots differences images,
and pin these images to bot's comment of pull request.

> **Why "Argus"?** Argus is a many-eyed "all-seeing" giant in Greek mythology.
> This character is known for having generated the saying "the eyes of Argus"
> (being subject to strict scrutiny in one's actions to an invasive, distressing degree).
> [(c) Wikipedia](https://en.wikipedia.org/wiki/Argus_Panoptes)

Read more about this tool:

-   [«Bots should work, developers should think»: Writing Github App with Node.js](https://medium.com/its-tinkoff/bots-should-work-developers-should-think-writing-github-app-with-node-js-2e8eb049d7e4) (English)
-   [«Боты должны работать, разработчики должны думать»: пишем Github App на Node.js](https://habr.com/ru/company/tbank/blog/580936/) (Russian)

## Setup :rocket:

GitHub Action is recommended approach to use bot.<br />
However, its deployment as GitHub App is option too.

### As GitHub Action

```yml
# .github/workflows/screenshot-bot.yml
on:
    workflow_run:
        workflows: [E2E Results] # <-- Choose any workflows to be watched by bot
        types: [requested, completed]
        branches-ignore:
            - 'main'
            - 'release/**'
    pull_request:
        types: [closed]

jobs:
    awake-screenshot-bot:
        runs-on: ubuntu-latest
        permissions:
            actions: read
            contents: write
            pull-requests: write
        steps:
            - uses: taiga-family/argus
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### As GitHub App

You can deploy your own Github App using this code and recipes from [Probot documentation](https://probot.github.io/docs/deployment).

After deployment:

-   Invite bot to you repo.
-   See its [configurable params](#bot-configurations-gear) or use default ones.

## Bot configurations :gear:

Bot has configurable params which can be unique for every Github repository.<br>
Every param is optional, and you can skip this section if default configuration satisfies you.

To pass custom params for bot you should create `screenshot-bot.config.yml` file inside the `.github` directory of repository.

**Example of `screenshot-bot.config.yml` file content** (you can paste it as it is) and **default values** of each param:

```yaml
# array of RegExp strings to match images inside artifacts (by their path or file name)
# which shows difference between two screenshot and which will be added to bot report comment
diff-paths: [
        # it is default Cypress folder name into which snapshot diffs are put
        '.*__diff_output__.*',
    ]

# array of attributes (key="value") for html-tag <img /> (screenshots)
# e.g. ['width="200px"', 'height="300px"']
img-attrs: []

# Text which is placed at the beginning of section "Failed tests"
failed-report-description: ''

# Regular expression string to match images inside artifacts (by their path or file name)
# which are created by new screenshot tests.
new-screenshot-mark: '.*==new==.*'

##################################
# Not relevant for GitHub Action #
##################################

# array of regular expression strings to match workflow names
# which should be watched by bot
workflows: [
        # all workflows with sub-string "screenshot" in their names
        '.*screenshot.*',
    ]

# array of RegExp strings to match branch names which should be skipped by bot
branches-ignore: []
```

## What bot can do? :bulb:

-   Holds first PR comment.
    All workflow updates edit already existing bot comment.
    No endless stream of comments from bot!
-   Sets loading state comment when PR is opened or new commits are pushed to PR.
    ![loading-demo](.demo/loading.png)
-   Downloads artifacts from workflow with tests, finds screenshots diffs images, and pins them to the tests failure report.
    ![error-report-demo](.demo/error-report.png)
-   Removes all uploaded images (for current PR) after closing pull request.
    ![closed-pr-demo](.demo/pr-closed.png)

## About Permissions :closed_lock_with_key:

If you use bot as GitHub Action it is required to provide `permissions` property in your `yml` file.<br>
If you use bot as GitHub App it asks for some permissions at the beginning of the bot's installation.<br>
All requested permissions are really needed, and we do not ask for more permissions than necessary.

#### Permissions

Bot requires the following repository's **permissions**:

-   `actions: read` - to get list of workflow run artifacts and download these artifacts.
-   `contents: write` - to create new branch for storage of screenshot diffs images
    and to ability to upload/delete these screenshot diffs images.
-   `metadata: read` - mandatory for Github App.
-   `pull_requests: write` - to create/edit PR's comment with bot's tests reports.

#### Events

Bot listens to the following repository's **events**:

-   `pull_request` — bot listens to pull request closing to delete all saved screenshots for current closed PR.
-   `workflow_run` — bot listens to workflow completion to download artifacts and send tests report as PR comment.

## Contributing

If you have suggestions for how bot could be improved, or want to report a bug, open an issue!
We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

🆓 Feel free to use our bot in your commercial and private applications.

Bot is covered by [Apache 2.0](/LICENSE).

Read more about this license [here](https://choosealicense.com/licenses/apache-2.0/).
