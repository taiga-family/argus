const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {Module} = require('node:module');
const path = require('node:path');
const {test} = require('node:test');
const ts = require('typescript');

function loadTypeScript(file, mocks = {}) {
    const filename = path.join(__dirname, '..', file);
    const source = readFileSync(filename, 'utf8');
    const code = ts.transpileModule(source, {
        compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
    }).outputText;
    const loaded = new Module(filename, module);

    loaded.filename = filename;
    loaded.paths = module.paths;
    loaded.require = (request) => mocks[request] ?? module.require(request);
    loaded._compile(code, filename);

    return loaded.exports;
}

const {getFailureReport, getFailureReportBatches} = loadTypeScript('src/utils/tests-report.utils.ts');
const options = {
    commitSha: '012345abcdef',
    botConfigs: {'failed-report-description': '', 'img-attrs': []},
};
const screenshots = (count, prefix = 'failed') =>
    Array.from({length: count}, (_, index) => [
        {entryName: `${prefix}-${index.toString().padStart(4, '0')}.diff.png`},
        `https://example.org/screenshots/${prefix}-${index}.png`,
    ]);

test('keeps small reports in the original single-comment format', () => {
    const failed = screenshots(2);

    assert.deepEqual(getFailureReportBatches(failed, [], options), [getFailureReport(failed, [], options)]);
});

test('splits 907 screenshot diffs without losing or duplicating images', () => {
    const batches = getFailureReportBatches(screenshots(907), [], options);
    const combined = batches.join('\n');

    assert.ok(batches.length > 1);

    for (const batch of batches) {
        assert.ok(batch.length <= 50_000);
        assert.equal((batch.match(/<details /g) || []).length, (batch.match(/<\/details>/g) || []).length);
    }

    assert.equal((combined.match(/<img src=/g) || []).length, 907);

    for (const [index, batch] of batches.entries()) {
        assert.ok(batch.includes(`Part ${index + 1}/${batches.length}`));
    }
});

test('preserves failed and new screenshot types across batches', () => {
    const batches = getFailureReportBatches(screenshots(600), screenshots(600, 'new'), options);
    const combined = batches.join('\n');

    assert.equal((combined.match(/<img src=/g) || []).length, 1200);
    assert.ok(combined.includes('Failed tests :x:'));
    assert.ok(combined.includes('New tests :test_tube:'));
    assert.ok(combined.includes('<details >'));
});

test('rejects a single screenshot entry larger than a comment batch', () => {
    const huge = [[{entryName: 'x'.repeat(49_000)}, 'https://example.org/x.png']];

    assert.throws(() => getFailureReportBatches(huge, [], options), /maximum comment batch size/);
});

const marker = (text, label) => `<!-- screenshot-bot-id: ${label} -->\n${text}`;
const {ScreenshotBot} = loadTypeScript('src/classes/bot.ts', {
    '../constants': {TEST_REPORT_HIDDEN_LABEL: 'test-report'},
    '../selectors': {},
    '../utils': {
        checkContainsHiddenLabel: (text, label) => text.includes(marker('', label)),
        markCommentWithHiddenLabel: marker,
    },
});

test('reuses all batch comments, paginates results and removes obsolete batches', async () => {
    let nextId = 1000;
    const comments = Array.from({length: 115}, () => ({
        id: nextId++,
        body: 'Human review',
        user: {type: 'User'},
    }));
    const humanMarker = {
        id: nextId++,
        body: marker('Human marker must not be edited', 'test-report-batch-2'),
        user: {type: 'User'},
    };

    comments.push(humanMarker, {
        id: nextId++,
        body: marker('Old report', 'test-report'),
        user: {type: 'Bot'},
    });
    const requests = {pages: 0, created: 0, updated: 0, deleted: 0};
    const issues = {
        listComments: async ({page, per_page}) => {
            requests.pages++;

            return {data: comments.slice((page - 1) * per_page, page * per_page)};
        },
        updateComment: async ({comment_id, body}) => {
            requests.updated++;
            comments.find((comment) => comment.id === comment_id).body = body;

            return {data: {id: comment_id, body}};
        },
        deleteComment: async ({comment_id}) => {
            requests.deleted++;
            comments.splice(
                comments.findIndex((comment) => comment.id === comment_id),
                1,
            );

            return {data: {}};
        },
        createComment: async ({body}) => {
            requests.created++;
            comments.push({id: nextId++, body, user: {type: 'Bot'}});

            return {data: comments.at(-1)};
        },
    };
    const bot = new ScreenshotBot({
        repo: (data = {}) => ({owner: 'taiga-family', repo: 'taiga-ui', ...data}),
        octokit: {issues, rest: {issues}},
    });

    await bot.createOrUpdateReportBatches(42, ['part one', 'part two', 'part three']);

    assert.equal(requests.created, 2);
    assert.equal(requests.updated, 1);
    assert.ok(requests.pages >= 2);
    assert.equal(comments.filter((c) => c.user.type === 'Bot').length, 3);

    await bot.createOrUpdateReportBatches(42, ['updated one', 'updated two', 'updated three']);

    assert.equal(requests.created, 2);
    assert.equal(requests.updated, 4);

    await bot.createOrUpdateReport(42, 'Success');

    assert.equal(requests.deleted, 2);
    assert.equal(comments.filter((c) => c.user.type === 'Bot').length, 1);
    assert.equal(comments.find((c) => c.user.type === 'Bot').body, marker('Success', 'test-report'));
    assert.ok(comments.some((c) => c.id === humanMarker.id));
});

test('rejects oversized comments before calling the GitHub API', async () => {
    const bot = new ScreenshotBot({
        repo: () => ({owner: 'taiga-family', repo: 'taiga-ui'}),
    });

    await assert.rejects(bot.createOrUpdateReportBatches(42, ['x'.repeat(66_000)]), /GitHub comment limit/);
});

test('removes previous screenshot batches when a test run restarts', async () => {
    const comments = [
        {id: 1, body: marker('Old main report', 'test-report'), user: {type: 'Bot'}},
        {id: 2, body: marker('Old batch 2', 'test-report-batch-2'), user: {type: 'Bot'}},
        {id: 3, body: marker('Old batch 3', 'test-report-batch-3'), user: {type: 'Bot'}},
        {id: 4, body: marker('Human report', 'test-report-batch-4'), user: {type: 'User'}},
    ];
    const removed = [];
    const issues = {
        listComments: async () => ({data: comments}),
        updateComment: async ({comment_id, body}) => {
            comments.find((comment) => comment.id === comment_id).body = body;

            return {data: {id: comment_id, body}};
        },
        deleteComment: async ({comment_id}) => {
            removed.push(comment_id);
            comments.splice(
                comments.findIndex((comment) => comment.id === comment_id),
                1,
            );

            return {data: {}};
        },
    };
    const bot = new ScreenshotBot({
        repo: (data = {}) => ({owner: 'taiga-family', repo: 'taiga-ui', ...data}),
        octokit: {rest: {issues}},
    });

    await bot.createOrUpdateReport(42, 'Loading');

    assert.deepEqual(removed, [2, 3]);
    assert.equal(comments.length, 2);
    assert.equal(comments[0].body, marker('Loading', 'test-report'));
    assert.equal(comments[1].user.type, 'User');
});

test('handles workflow_run.in_progress to reset reports on re-runs', async () => {
    const handlers = new Map();
    const calls = [];
    const register = loadTypeScript('src/index.ts', {
        './classes': {
            ScreenshotBot: function ScreenshotBot() {
                return {
                    getWorkflowPrNumber: async () => 42,
                    checkShouldSkipWorkflow: async () => false,
                    createOrUpdateReport: async (number, body) => {
                        calls.push([number, body]);
                    },
                };
            },
        },
        './constants': {BotReportMessage: {LoadingWorkflow: 'Loading'}},
        './selectors': {
            getWorkflowName: () => 'E2E testing',
            getWorkflowBranch: () => 'feature',
        },
        './utils': {},
    }).default;

    register({on: (name, callback) => handlers.set(name, callback)});

    assert.ok(handlers.has('workflow_run.requested'));
    assert.ok(handlers.has('workflow_run.in_progress'));
    await handlers.get('workflow_run.in_progress')({});

    assert.deepEqual(calls, [[42, 'Loading']]);
});
