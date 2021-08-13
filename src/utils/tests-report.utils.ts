const createScreenshotRowInfo = (link: string): string => {
  return `**TODO**: add path to image:\n![](${link})<hr>\n`;
};

export const getFailureReport = (imageUrls: string[]): string =>
`
Screenshots tests failed :x:\n 
${imageUrls.map(createScreenshotRowInfo).join('')}
`;
