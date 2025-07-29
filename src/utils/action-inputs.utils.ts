import * as core from '@actions/core';
import type { IBotConfigs } from '../types';

/**
 * Parse array input from GitHub Action.
 * Supports both multiline string format and JSON format.
 * 
 * @param input - The raw input string
 * @returns Array of strings
 */
function parseArrayInput(input: string): string[] {
    if (!input.trim()) {
        return [];
    }

    // Try to parse as JSON first
    try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
            return parsed.map(item => String(item));
        }
    } catch {
        // Not valid JSON, continue to multiline parsing
    }

    // Parse as multiline string (split by newlines and trim)
    return input
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

/**
 * Get bot configuration from GitHub Action inputs.
 * Returns null if no action inputs are provided.
 * 
 * @returns Partial bot configuration from action inputs or null
 */
export function getBotConfigFromActionInputs(): Partial<IBotConfigs> | null {
    // Check if we're running in GitHub Actions environment
    if (!process.env.GITHUB_ACTIONS) {
        return null;
    }

    const diffPaths = core.getInput('diff-paths');
    const imgAttrs = core.getInput('img-attrs');
    const failedReportDescription = core.getInput('failed-report-description');
    const newScreenshotMark = core.getInput('new-screenshot-mark');
    const branchesIgnore = core.getInput('branches-ignore');

    // If no inputs are provided, return null to fall back to config file
    if (!diffPaths && !imgAttrs && !failedReportDescription && !newScreenshotMark && !branchesIgnore) {
        return null;
    }

    const config: Partial<IBotConfigs> = {};

    if (diffPaths) {
        config.screenshotsDiffsPaths = parseArrayInput(diffPaths);
    }

    if (imgAttrs) {
        config.screenshotImageAttrs = parseArrayInput(imgAttrs);
    }

    if (failedReportDescription) {
        config.failedTestsReportDescription = failedReportDescription;
    }

    if (newScreenshotMark) {
        config.newScreenshotMark = newScreenshotMark;
    }

    if (branchesIgnore) {
        config.branchesIgnore = parseArrayInput(branchesIgnore);
    }

    return config;
}