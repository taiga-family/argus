export const zip = <T, G>(a: T[], b: G[]): [T, G][] => a.map((item, i) => [item, b[i]]);
