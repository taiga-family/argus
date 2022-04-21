import { IZipEntry } from 'adm-zip';

const createCollapsibleScreenshot = (
    [{ entryName }, link]: [IZipEntry, string],
    initialOpen: boolean = true
): string => `
<details ${initialOpen ? 'open' : ''}>
    <summary><strong>${entryName}</strong></summary>
    <img src="${link}" height="300"/>
</details>
`;

const createReport = (
    header: string,
    screenshotsInfo: [IZipEntry, string][],
    allOpen: boolean = true
): string => `
<h1>${header}</h1>
${screenshotsInfo
    .map((screenshot) => createCollapsibleScreenshot(screenshot, allOpen))
    .join('')}
`;

export const getFailureReport = (
    failedTests: [IZipEntry, string][],
    newTests: [IZipEntry, string][],
    { commitSha }: { commitSha: string }
): string => `
${failedTests.length ? createReport('Failed tests :x:', failedTests, true) : ''}
<br />
${newTests.length ? createReport('New tests :test_tube:', newTests, false) : ''}

<sub>(updated for commit ${commitSha})</sub>
`;
