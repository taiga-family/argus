import {type IZipEntry} from 'adm-zip';

import {type IBotConfigs} from '../types';

const createCollapsibleScreenshot = (
    [{entryName}, link]: [IZipEntry, string],
    initialOpen = true,
    imageAttrs: string[] = [],
): string => `
<details ${initialOpen ? 'open' : ''}>
    <summary><strong>${entryName}</strong></summary>
    <img src="${link}" ${imageAttrs.join(' ')}/>
</details>
`;

const createReport = (
    header: string,
    screenshotsInfo: Array<[IZipEntry, string]>,
    {
        allOpen = true,
        description = '',
        imageAttrs = [],
    }: {allOpen?: boolean; description?: string; imageAttrs?: string[]},
): string => `
<h1>${header}</h1>

${description}

${screenshotsInfo
    .map((screenshot) => createCollapsibleScreenshot(screenshot, allOpen, imageAttrs))
    .join('')}
`;

export const getFailureReport = (
    failedTests: Array<[IZipEntry, string]>,
    newTests: Array<[IZipEntry, string]>,
    {commitSha, botConfigs}: {botConfigs: Required<IBotConfigs>; commitSha: string},
): string => `
${
    failedTests.length
        ? createReport('Failed tests :x:', failedTests, {
              allOpen: true,
              description: botConfigs['failed-report-description'],
              imageAttrs: botConfigs['img-attrs'],
          })
        : ''
}
<br />
${
    newTests.length
        ? createReport('New tests :test_tube:', newTests, {
              allOpen: false,
              imageAttrs: botConfigs['img-attrs'],
          })
        : ''
}

<sub>(updated for commit ${commitSha})</sub>
`;

/**
 * Keep well below GitHub's 65,536-character issue comment limit, leaving room
 * for the hidden report marker and the batch header.
 */
const MAX_REPORT_BATCH_BODY_LENGTH = 48_000;

export const getFailureReportBatches = (
    failedTests: Array<[IZipEntry, string]>,
    newTests: Array<[IZipEntry, string]>,
    options: {botConfigs: Required<IBotConfigs>; commitSha: string},
): string[] => {
    const report = getFailureReport(failedTests, newTests, options);

    if (report.length <= MAX_REPORT_BATCH_BODY_LENGTH) {
        return [report];
    }

    type ScreenshotType = 'failed' | 'new';

    const entries: Array<{type: ScreenshotType; markup: string}> = [
        ...failedTests.map((screenshot) => ({
            type: 'failed' as const,
            markup: createCollapsibleScreenshot(
                screenshot,
                true,
                options.botConfigs['img-attrs'],
            ),
        })),
        ...newTests.map((screenshot) => ({
            type: 'new' as const,
            markup: createCollapsibleScreenshot(
                screenshot,
                false,
                options.botConfigs['img-attrs'],
            ),
        })),
    ];

    const headings = {
        failed: `<h1>Failed tests :x:</h1>\n\n${options.botConfigs['failed-report-description']}\n\n`,
        new: '<h1>New tests :test_tube:</h1>\n\n',
    };

    const batches: string[] = [];
    let current = '';
    let currentType: ScreenshotType | null = null;

    for (const {type, markup} of entries) {
        let section = `${currentType === type ? '' : headings[type]}${markup}`;

        if (current && current.length + section.length > MAX_REPORT_BATCH_BODY_LENGTH) {
            batches.push(current);
            current = '';
            currentType = null;
            section = `${headings[type]}${markup}`;
        }

        if (section.length > MAX_REPORT_BATCH_BODY_LENGTH) {
            throw new Error(
                'A screenshot report entry exceeds the maximum comment batch size',
            );
        }

        current += section;
        currentType = type;
    }

    if (current) {
        batches.push(current);
    }

    return batches.map(
        (body, index) =>
            `## Screenshot report — Part ${index + 1}/${batches.length}\n\n${body}\n\n<sub>(updated for commit ${options.commitSha})</sub>`,
    );
};
