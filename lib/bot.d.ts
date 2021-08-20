/// <reference types="node" />
import { Context } from 'probot/lib/context';
import { IZipEntry } from 'adm-zip';
import { IBotConfigs } from './types';
export declare abstract class Bot {
    protected context: Context;
    constructor(context: Context);
    /**
     * Send comment to the issue
     * (pull request is the same issue but with code).
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/issues#create-an-issue-comment Create an issue comment}:
     * GitHub App must have the **issues:write**
     * (or **pull_requests:write** if you are working only with PRs) permission to use this endpoints.
     *
     * @param issueNumber
     * @param markdownText string (optionally, can include markdown syntax)
     */
    sendComment(issueNumber: number, markdownText: string): Promise<import("@octokit/types").OctokitResponse<{
        id: number;
        node_id: string;
        url: string;
        body?: string | undefined;
        body_text?: string | undefined;
        body_html?: string | undefined;
        html_url: string;
        user: {
            name?: string | null | undefined;
            email?: string | null | undefined;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string | undefined;
        } | null;
        created_at: string;
        updated_at: string;
        issue_url: string;
        author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MANNEQUIN" | "MEMBER" | "NONE" | "OWNER";
        performed_via_github_app?: {
            id: number;
            slug?: string | undefined;
            node_id: string;
            owner: {
                name?: string | null | undefined;
                email?: string | null | undefined;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string | undefined;
            } | null;
            name: string;
            description: string | null;
            external_url: string;
            html_url: string;
            created_at: string;
            updated_at: string;
            permissions: {
                issues?: string | undefined;
                checks?: string | undefined;
                metadata?: string | undefined;
                contents?: string | undefined;
                deployments?: string | undefined;
            } & {
                [key: string]: string;
            };
            events: string[];
            installations_count?: number | undefined;
            client_id?: string | undefined;
            client_secret?: string | undefined;
            webhook_secret?: string | null | undefined;
            pem?: string | undefined;
        } | null | undefined;
        reactions?: {
            url: string;
            total_count: number;
            "+1": number;
            "-1": number;
            laugh: number;
            confused: number;
            heart: number;
            hooray: number;
            eyes: number;
            rocket: number;
        } | undefined;
    }, 201>>;
    /**
     * Update certain comment in the issue (pull request is the same issue but with code).
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/issues#update-an-issue-comment Update an issue comment}:
     * GitHub App must have the **issues:write**
     * (or **pull_requests:write** if you are working only with PRs) permission to use this endpoints.
     *
     * @param commentId
     * @param newMarkdownContent string (optionally, can include markdown syntax)
     */
    updateComment(commentId: number, newMarkdownContent: string): Promise<import("@octokit/types").OctokitResponse<{
        id: number;
        node_id: string;
        url: string;
        body?: string | undefined;
        body_text?: string | undefined;
        body_html?: string | undefined;
        html_url: string;
        user: {
            name?: string | null | undefined;
            email?: string | null | undefined;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string | undefined;
        } | null;
        created_at: string;
        updated_at: string;
        issue_url: string;
        author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MANNEQUIN" | "MEMBER" | "NONE" | "OWNER";
        performed_via_github_app?: {
            id: number;
            slug?: string | undefined;
            node_id: string;
            owner: {
                name?: string | null | undefined;
                email?: string | null | undefined;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string | undefined;
            } | null;
            name: string;
            description: string | null;
            external_url: string;
            html_url: string;
            created_at: string;
            updated_at: string;
            permissions: {
                issues?: string | undefined;
                checks?: string | undefined;
                metadata?: string | undefined;
                contents?: string | undefined;
                deployments?: string | undefined;
            } & {
                [key: string]: string;
            };
            events: string[];
            installations_count?: number | undefined;
            client_id?: string | undefined;
            client_secret?: string | undefined;
            webhook_secret?: string | null | undefined;
            pem?: string | undefined;
        } | null | undefined;
        reactions?: {
            url: string;
            total_count: number;
            "+1": number;
            "-1": number;
            laugh: number;
            confused: number;
            heart: number;
            hooray: number;
            eyes: number;
            rocket: number;
        } | undefined;
    }, 200>>;
    /**
     * Get info about all comments in the current issue/PR.
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/issues#list-issue-comments List issue comments}:
     * GitHub App must have the **issues:read**
     * (or **pull_requests:read** if you are working only with PRs) permission to use this endpoints.
     */
    getCommentsByIssueId(issueNumber: number): Promise<{
        id: number;
        node_id: string;
        url: string;
        body?: string | undefined;
        body_text?: string | undefined;
        body_html?: string | undefined;
        html_url: string;
        user: {
            name?: string | null | undefined;
            email?: string | null | undefined;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string | undefined;
        } | null;
        created_at: string;
        updated_at: string;
        issue_url: string;
        author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MANNEQUIN" | "MEMBER" | "NONE" | "OWNER";
        performed_via_github_app?: {
            id: number;
            slug?: string | undefined;
            node_id: string;
            owner: {
                name?: string | null | undefined;
                email?: string | null | undefined;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string | undefined;
            } | null;
            name: string;
            description: string | null;
            external_url: string;
            html_url: string;
            created_at: string;
            updated_at: string;
            permissions: {
                issues?: string | undefined;
                checks?: string | undefined;
                metadata?: string | undefined;
                contents?: string | undefined;
                deployments?: string | undefined;
            } & {
                [key: string]: string;
            };
            events: string[];
            installations_count?: number | undefined;
            client_id?: string | undefined;
            client_secret?: string | undefined;
            webhook_secret?: string | null | undefined;
            pem?: string | undefined;
        } | null | undefined;
        reactions?: {
            url: string;
            total_count: number;
            "+1": number;
            "-1": number;
            laugh: number;
            confused: number;
            heart: number;
            hooray: number;
            eyes: number;
            rocket: number;
        } | undefined;
    }[]>;
    /**
     * Download artifacts (zip files) in the workflow and unpack them.
     *
     * This method uses two github api endpoints:
     * - {@link https://docs.github.com/en/rest/reference/actions#list-workflow-run-artifacts List workflow run artifacts}
     * - {@link https://docs.github.com/en/rest/reference/actions#download-an-artifact Download an artifact}
     *
     * GitHub App must have the **actions:read** permission to use these endpoints.
     */
    getWorkflowArtifacts<T>(workflowRunId: number): Promise<T[]>;
    /**
     * Get file (+ meta info about it) by its path in the repository.
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/repos#get-repository-content Get repository content}:
     * GitHub App must have the **contents:read** (or **single_file:read** to required files) permission to use this endpoints.
     *
     * @param path file location (from root of repo)
     * @param branch target branch
     * (if branch param is not provided it takes the repository’s default branch (usually master/main))
     */
    getFile(path: string, branch?: string): Promise<import("@octokit/types").OctokitResponse<{
        type: string;
        size: number;
        name: string;
        path: string;
        content?: string | undefined;
        sha: string;
        url: string;
        git_url: string | null;
        html_url: string | null;
        download_url: string | null;
        _links: {
            git: string | null;
            html: string | null;
            self: string;
        };
    }[] | {
        type: string;
        encoding: string;
        size: number;
        name: string;
        path: string;
        content: string;
        sha: string;
        url: string;
        git_url: string | null;
        html_url: string | null;
        download_url: string | null;
        _links: {
            git: string | null;
            html: string | null;
            self: string;
        };
        target?: string | undefined;
        submodule_git_url?: string | undefined;
    } | {
        type: string;
        target: string;
        size: number;
        name: string;
        path: string;
        sha: string;
        url: string;
        git_url: string | null;
        html_url: string | null;
        download_url: string | null;
        _links: {
            git: string | null;
            html: string | null;
            self: string;
        };
    } | {
        type: string;
        submodule_git_url: string;
        size: number;
        name: string;
        path: string;
        sha: string;
        url: string;
        git_url: string | null;
        html_url: string | null;
        download_url: string | null;
        _links: {
            git: string | null;
            html: string | null;
            self: string;
        };
    }, 200> | null>;
    /**
     * Get info about git branch by its name.
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/repos#get-a-branch Get a branch}:
     * GitHub App must have the **contents:read** permission to use this endpoints.
     */
    getBranchInfo(branch: string): Promise<import("@octokit/types").OctokitResponse<{
        name: string;
        commit: {
            url: string;
            sha: string;
            node_id: string;
            html_url: string;
            comments_url: string;
            commit: {
                url: string;
                author: {
                    name?: string | undefined;
                    email?: string | undefined;
                    date?: string | undefined;
                } | null;
                committer: {
                    name?: string | undefined;
                    email?: string | undefined;
                    date?: string | undefined;
                } | null;
                message: string;
                comment_count: number;
                tree: {
                    sha: string;
                    url: string;
                };
                verification?: {
                    verified: boolean;
                    reason: string;
                    payload: string | null;
                    signature: string | null;
                } | undefined;
            };
            author: {
                name?: string | null | undefined;
                email?: string | null | undefined;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string | undefined;
            } | null;
            committer: {
                name?: string | null | undefined;
                email?: string | null | undefined;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string | undefined;
            } | null;
            parents: {
                sha: string;
                url: string;
                html_url?: string | undefined;
            }[];
            stats?: {
                additions?: number | undefined;
                deletions?: number | undefined;
                total?: number | undefined;
            } | undefined;
            files?: {
                filename?: string | undefined;
                additions?: number | undefined;
                deletions?: number | undefined;
                changes?: number | undefined;
                status?: string | undefined;
                raw_url?: string | undefined;
                blob_url?: string | undefined;
                patch?: string | undefined;
                sha?: string | undefined;
                contents_url?: string | undefined;
                previous_filename?: string | undefined;
            }[] | undefined;
        };
        _links: {
            html: string;
            self: string;
        };
        protected: boolean;
        protection: {
            url?: string | undefined;
            enabled?: boolean | undefined;
            required_status_checks?: {
                url?: string | undefined;
                enforcement_level?: string | undefined;
                contexts: string[];
                contexts_url?: string | undefined;
                strict?: boolean | undefined;
            } | undefined;
            enforce_admins?: {
                url: string;
                enabled: boolean;
            } | undefined;
            required_pull_request_reviews?: {
                url?: string | undefined;
                dismissal_restrictions?: {
                    users?: ({
                        name?: string | null | undefined;
                        email?: string | null | undefined;
                        login: string;
                        id: number;
                        node_id: string;
                        avatar_url: string;
                        gravatar_id: string | null;
                        url: string;
                        html_url: string;
                        followers_url: string;
                        following_url: string;
                        gists_url: string;
                        starred_url: string;
                        subscriptions_url: string;
                        organizations_url: string;
                        repos_url: string;
                        events_url: string;
                        received_events_url: string;
                        type: string;
                        site_admin: boolean;
                        starred_at?: string | undefined;
                    } | null)[] | undefined;
                    teams?: {
                        id: number;
                        node_id: string;
                        name: string;
                        slug: string;
                        description: string | null;
                        privacy?: string | undefined;
                        permission: string;
                        permissions?: {
                            pull: boolean;
                            triage: boolean;
                            push: boolean;
                            maintain: boolean;
                            admin: boolean;
                        } | undefined;
                        url: string;
                        html_url: string;
                        members_url: string;
                        repositories_url: string;
                        parent: {
                            id: number;
                            node_id: string;
                            url: string;
                            members_url: string;
                            name: string;
                            description: string | null;
                            permission: string;
                            privacy?: string | undefined;
                            html_url: string;
                            repositories_url: string;
                            slug: string;
                            ldap_dn?: string | undefined;
                        } | null;
                    }[] | undefined;
                    url?: string | undefined;
                    users_url?: string | undefined;
                    teams_url?: string | undefined;
                } | undefined;
                dismiss_stale_reviews: boolean;
                require_code_owner_reviews: boolean;
                required_approving_review_count?: number | undefined;
            } | undefined;
            restrictions?: {
                url: string;
                users_url: string;
                teams_url: string;
                apps_url: string;
                users: {
                    login?: string | undefined;
                    id?: number | undefined;
                    node_id?: string | undefined;
                    avatar_url?: string | undefined;
                    gravatar_id?: string | undefined;
                    url?: string | undefined;
                    html_url?: string | undefined;
                    followers_url?: string | undefined;
                    following_url?: string | undefined;
                    gists_url?: string | undefined;
                    starred_url?: string | undefined;
                    subscriptions_url?: string | undefined;
                    organizations_url?: string | undefined;
                    repos_url?: string | undefined;
                    events_url?: string | undefined;
                    received_events_url?: string | undefined;
                    type?: string | undefined;
                    site_admin?: boolean | undefined;
                }[];
                teams: {
                    id?: number | undefined;
                    node_id?: string | undefined;
                    url?: string | undefined;
                    html_url?: string | undefined;
                    name?: string | undefined;
                    slug?: string | undefined;
                    description?: string | null | undefined;
                    privacy?: string | undefined;
                    permission?: string | undefined;
                    members_url?: string | undefined;
                    repositories_url?: string | undefined;
                    parent?: string | null | undefined;
                }[];
                apps: {
                    id?: number | undefined;
                    slug?: string | undefined;
                    node_id?: string | undefined;
                    owner?: {
                        login?: string | undefined;
                        id?: number | undefined;
                        node_id?: string | undefined;
                        url?: string | undefined;
                        repos_url?: string | undefined;
                        events_url?: string | undefined;
                        hooks_url?: string | undefined;
                        issues_url?: string | undefined;
                        members_url?: string | undefined;
                        public_members_url?: string | undefined;
                        avatar_url?: string | undefined;
                        description?: string | undefined;
                        gravatar_id?: string | undefined;
                        html_url?: string | undefined;
                        followers_url?: string | undefined;
                        following_url?: string | undefined;
                        gists_url?: string | undefined;
                        starred_url?: string | undefined;
                        subscriptions_url?: string | undefined;
                        organizations_url?: string | undefined;
                        received_events_url?: string | undefined;
                        type?: string | undefined;
                        site_admin?: boolean | undefined;
                    } | undefined;
                    name?: string | undefined;
                    description?: string | undefined;
                    external_url?: string | undefined;
                    html_url?: string | undefined;
                    created_at?: string | undefined;
                    updated_at?: string | undefined;
                    permissions?: {
                        metadata?: string | undefined;
                        contents?: string | undefined;
                        issues?: string | undefined;
                        single_file?: string | undefined;
                    } | undefined;
                    events?: string[] | undefined;
                }[];
            } | undefined;
            required_linear_history?: {
                enabled?: boolean | undefined;
            } | undefined;
            allow_force_pushes?: {
                enabled?: boolean | undefined;
            } | undefined;
            allow_deletions?: {
                enabled?: boolean | undefined;
            } | undefined;
            required_conversation_resolution?: {
                enabled?: boolean | undefined;
            } | undefined;
            name?: string | undefined;
            protection_url?: string | undefined;
            required_signatures?: {
                url: string;
                enabled: boolean;
            } | undefined;
        };
        protection_url: string;
        pattern?: string | undefined;
        required_approving_review_count?: number | undefined;
    }, 200> | null>;
    /**
     * Create git branch in current repository (do nothing if branch already exists).
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/git#create-a-reference Create a reference}:
     * GitHub App must have the **contents:write** permission to use this endpoints.
     *
     * @param branch new branch name
     * @param fromBranch from which to create new branch
     * (if branch param is not provided it tries to parse repository’s default branch or use {@link DEFAULT_MAIN_BRANCH})
     */
    createBranch(branch: string, fromBranch?: string): Promise<import("@octokit/types").OctokitResponse<{
        ref: string;
        node_id: string;
        url: string;
        object: {
            type: string;
            sha: string;
            url: string;
        };
    }, 201> | undefined>;
    /**
     * Upload file to a separate branch.
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents Create or update file contents}:
     * GitHub App must have the **single_file:write** permission (to required files) to use this endpoints
     * (or **contents:write**).
     */
    uploadFile({ file, path, branch, commitMessage }: {
        /** buffer of the file */
        file: Buffer;
        /** path of future file (including file name + file format) */
        path: string;
        commitMessage: string;
        branch: string;
    }): Promise<string>;
    /**
     * Delete file in the following branch.
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/repos#delete-a-file Delete a file}:
     * GitHub App must have the **single_file:write** permission (to required files) to use this endpoints
     * (or **contents:write**).
     */
    deleteFile({ path, commitMessage, branch }: {
        path: string;
        commitMessage: string;
        branch: string;
    }): Promise<import("@octokit/types").OctokitResponse<{
        content: {
            name?: string | undefined;
            path?: string | undefined;
            sha?: string | undefined;
            size?: number | undefined;
            url?: string | undefined;
            html_url?: string | undefined;
            git_url?: string | undefined;
            download_url?: string | undefined;
            type?: string | undefined;
            _links?: {
                self?: string | undefined;
                git?: string | undefined;
                html?: string | undefined;
            } | undefined;
        } | null;
        commit: {
            sha?: string | undefined;
            node_id?: string | undefined;
            url?: string | undefined;
            html_url?: string | undefined;
            author?: {
                date?: string | undefined;
                name?: string | undefined;
                email?: string | undefined;
            } | undefined;
            committer?: {
                date?: string | undefined;
                name?: string | undefined;
                email?: string | undefined;
            } | undefined;
            message?: string | undefined;
            tree?: {
                url?: string | undefined;
                sha?: string | undefined;
            } | undefined;
            parents?: {
                url?: string | undefined;
                html_url?: string | undefined;
                sha?: string | undefined;
            }[] | undefined;
            verification?: {
                verified?: boolean | undefined;
                reason?: string | undefined;
                signature?: string | null | undefined;
                payload?: string | null | undefined;
            } | undefined;
        };
    }, 200>>;
}
export declare class ArgusBot extends Bot {
    private botConfigs;
    loadBotConfigs(branch?: string): Promise<IBotConfigs>;
    getPrevBotReportComment(prNumber: number): Promise<{
        id: number;
        node_id: string;
        url: string;
        body?: string | undefined;
        body_text?: string | undefined;
        body_html?: string | undefined;
        html_url: string;
        user: {
            name?: string | null | undefined;
            email?: string | null | undefined;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string | undefined;
        } | null;
        created_at: string;
        updated_at: string;
        issue_url: string;
        author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MANNEQUIN" | "MEMBER" | "NONE" | "OWNER";
        performed_via_github_app?: {
            id: number;
            slug?: string | undefined;
            node_id: string;
            owner: {
                name?: string | null | undefined;
                email?: string | null | undefined;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string | undefined;
            } | null;
            name: string;
            description: string | null;
            external_url: string;
            html_url: string;
            created_at: string;
            updated_at: string;
            permissions: {
                issues?: string | undefined;
                checks?: string | undefined;
                metadata?: string | undefined;
                contents?: string | undefined;
                deployments?: string | undefined;
            } & {
                [key: string]: string;
            };
            events: string[];
            installations_count?: number | undefined;
            client_id?: string | undefined;
            client_secret?: string | undefined;
            webhook_secret?: string | null | undefined;
            pem?: string | undefined;
        } | null | undefined;
        reactions?: {
            url: string;
            total_count: number;
            "+1": number;
            "-1": number;
            laugh: number;
            confused: number;
            heart: number;
            hooray: number;
            eyes: number;
            rocket: number;
        } | undefined;
    } | null>;
    createOrUpdateReport(prNumber: number, markdownText: string): Promise<import("@octokit/types").OctokitResponse<{
        id: number;
        node_id: string;
        url: string;
        body?: string | undefined;
        body_text?: string | undefined;
        body_html?: string | undefined;
        html_url: string;
        user: {
            name?: string | null | undefined;
            email?: string | null | undefined;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string | undefined;
        } | null;
        created_at: string;
        updated_at: string;
        issue_url: string;
        author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MANNEQUIN" | "MEMBER" | "NONE" | "OWNER";
        performed_via_github_app?: {
            id: number;
            slug?: string | undefined;
            node_id: string;
            owner: {
                name?: string | null | undefined;
                email?: string | null | undefined;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string | undefined;
            } | null;
            name: string;
            description: string | null;
            external_url: string;
            html_url: string;
            created_at: string;
            updated_at: string;
            permissions: {
                issues?: string | undefined;
                checks?: string | undefined;
                metadata?: string | undefined;
                contents?: string | undefined;
                deployments?: string | undefined;
            } & {
                [key: string]: string;
            };
            events: string[];
            installations_count?: number | undefined;
            client_id?: string | undefined;
            client_secret?: string | undefined;
            webhook_secret?: string | null | undefined;
            pem?: string | undefined;
        } | null | undefined;
        reactions?: {
            url: string;
            total_count: number;
            "+1": number;
            "-1": number;
            laugh: number;
            confused: number;
            heart: number;
            hooray: number;
            eyes: number;
            rocket: number;
        } | undefined;
    }, 201> | import("@octokit/types").OctokitResponse<{
        id: number;
        node_id: string;
        url: string;
        body?: string | undefined;
        body_text?: string | undefined;
        body_html?: string | undefined;
        html_url: string;
        user: {
            name?: string | null | undefined;
            email?: string | null | undefined;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string | undefined;
        } | null;
        created_at: string;
        updated_at: string;
        issue_url: string;
        author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MANNEQUIN" | "MEMBER" | "NONE" | "OWNER";
        performed_via_github_app?: {
            id: number;
            slug?: string | undefined;
            node_id: string;
            owner: {
                name?: string | null | undefined;
                email?: string | null | undefined;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string | undefined;
            } | null;
            name: string;
            description: string | null;
            external_url: string;
            html_url: string;
            created_at: string;
            updated_at: string;
            permissions: {
                issues?: string | undefined;
                checks?: string | undefined;
                metadata?: string | undefined;
                contents?: string | undefined;
                deployments?: string | undefined;
            } & {
                [key: string]: string;
            };
            events: string[];
            installations_count?: number | undefined;
            client_id?: string | undefined;
            client_secret?: string | undefined;
            webhook_secret?: string | null | undefined;
            pem?: string | undefined;
        } | null | undefined;
        reactions?: {
            url: string;
            total_count: number;
            "+1": number;
            "-1": number;
            laugh: number;
            confused: number;
            heart: number;
            hooray: number;
            eyes: number;
            rocket: number;
        } | undefined;
    }, 200>>;
    getScreenshotDiffImages(zipFile: ArrayBuffer | Buffer, branch?: string): Promise<IZipEntry[]>;
    uploadImages(images: Buffer[], prNumber: number): Promise<string[]>;
    checkShouldSkipWorkflow(workflowName: string, workflowBranch?: string): Promise<boolean>;
    deleteUploadedImagesFolder(prNumber: number): Promise<import("@octokit/types").OctokitResponse<{
        content: {
            name?: string | undefined;
            path?: string | undefined;
            sha?: string | undefined;
            size?: number | undefined;
            url?: string | undefined;
            html_url?: string | undefined;
            git_url?: string | undefined;
            download_url?: string | undefined;
            type?: string | undefined;
            _links?: {
                self?: string | undefined;
                git?: string | undefined;
                html?: string | undefined;
            } | undefined;
        } | null;
        commit: {
            sha?: string | undefined;
            node_id?: string | undefined;
            url?: string | undefined;
            html_url?: string | undefined;
            author?: {
                date?: string | undefined;
                name?: string | undefined;
                email?: string | undefined;
            } | undefined;
            committer?: {
                date?: string | undefined;
                name?: string | undefined;
                email?: string | undefined;
            } | undefined;
            message?: string | undefined;
            tree?: {
                url?: string | undefined;
                sha?: string | undefined;
            } | undefined;
            parents?: {
                url?: string | undefined;
                html_url?: string | undefined;
                sha?: string | undefined;
            }[] | undefined;
            verification?: {
                verified?: boolean | undefined;
                reason?: string | undefined;
                signature?: string | null | undefined;
                payload?: string | null | undefined;
            } | undefined;
        };
    }, 200>[] | null>;
    private getSavedImagePathPrefix;
}
