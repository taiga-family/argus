import {IZipEntry} from 'adm-zip';

const createScreenshotRowInfo = ([{entryName}, link]: [IZipEntry, string]): string => {
  return `<h4>${entryName}:</h4>\n\n ![](${link})\n<br>\n`;
};

export const getFailureReport = (imagesInfo: [IZipEntry, string][]): string =>
`
<h1>Screenshots tests failed :x:</h1>\n
${imagesInfo.map(createScreenshotRowInfo).join('')}
`;
