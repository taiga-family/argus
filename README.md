# argus

## Roadmap
- [X] edit already created message instead of new one's creation
- [X] refresh comment with loading status (if it exists) on _workflow_run.requested_
- [ ] listen closing/merge of PR and delete saved screenshots diff folder
- [ ] check all permissions again (with turning extra off) and update app.yml file
- [ ] write **About Permissions** and describe why bot need every if them
- [ ] make configurable param (bot parse repo environments?) to detect
after which workflow bot should look for artifacts zip with test screenshots
(parsing workflow name and find words with artifacts)
- [ ] deploy to glitch
- [ ] test first draft of app

> A GitHub App built with [Probot](https://github.com/probot/probot) that TODO

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t argus .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> argus
```

## Contributing

If you have suggestions for how argus could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2021 Barsukov Nikita <nikita.s.barsukov@gmail.com>