import type { IZipEntry } from 'adm-zip';
import type { IBotConfigs } from '../types';

const createCollapsibleScreenshot = (
    [{ entryName }, link]: [IZipEntry, string],
    initialOpen: boolean = true,
    imageAttrs: string[] = []
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
    }: { allOpen?: boolean; description?: string; imageAttrs?: string[] }
): string => `
<h1>${header}</h1>

${description}

${screenshotsInfo
    .map((screenshot) =>
        createCollapsibleScreenshot(screenshot, allOpen, imageAttrs)
    )
    .join('')}
`;

export const getFailureReport = (
    failedTests: Array<[IZipEntry, string]>,
    newTests: Array<[IZipEntry, string]>,
    {
        commitSha,
        botConfigs,
    }: { botConfigs: Required<IBotConfigs>; commitSha: string }
): string => `
${
    failedTests.length
        ? createReport('Failed tests :x:', failedTests, {
              allOpen: true,
              description: botConfigs.failedTestsReportDescription,
              imageAttrs: botConfigs.screenshotImageAttrs,
          })
        : ''
}
<br />
${
    newTests.length
        ? createReport('New tests :test_tube:', newTests, {
              allOpen: false,
              imageAttrs: botConfigs.screenshotImageAttrs,
          })
        : ''
}

<sub>(updated for commit ${commitSha})</sub>
`;
