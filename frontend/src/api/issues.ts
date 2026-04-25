import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from './client';
import type { IssueDto, CreateIssueRequest, UpdateIssueRequest, CommentDto, CreateCommentRequest, UpdateCommentRequest } from '@/types';

export async function listProjectIssues(
  projectId: number,
  params?: Record<string, string | number>,
): Promise<IssueDto[]> {
  const res = await apiGetPaginated<IssueDto>(`/projects/${projectId}/issues`, {
    size: 100,
    ...params,
  });
  return res.data;
}

export async function getIssue(projectId: number, issueId: number): Promise<IssueDto> {
  return apiGet<IssueDto>(`/projects/${projectId}/issues/${issueId}`);
}

export async function createIssue(projectId: number, request: CreateIssueRequest): Promise<IssueDto> {
  return apiPost<IssueDto>(`/projects/${projectId}/issues`, request);
}

export async function updateIssue(projectId: number, issueId: number, request: UpdateIssueRequest): Promise<IssueDto> {
  return apiPut<IssueDto>(`/projects/${projectId}/issues/${issueId}`, request);
}

export async function deleteIssue(projectId: number, issueId: number): Promise<void> {
  await apiDelete(`/projects/${projectId}/issues/${issueId}`);
}

// Comments
export async function getComments(projectId: number, issueId: number): Promise<CommentDto[]> {
  return apiGet<CommentDto[]>(`/projects/${projectId}/issues/${issueId}/comments`);
}

export async function addComment(projectId: number, issueId: number, request: CreateCommentRequest): Promise<CommentDto> {
  return apiPost<CommentDto>(`/projects/${projectId}/issues/${issueId}/comments`, request);
}

export async function updateComment(projectId: number, issueId: number, commentId: number, request: UpdateCommentRequest): Promise<CommentDto> {
  return apiPut<CommentDto>(`/projects/${projectId}/issues/${issueId}/comments/${commentId}`, request);
}

export async function deleteComment(projectId: number, issueId: number, commentId: number): Promise<void> {
  await apiDelete(`/projects/${projectId}/issues/${issueId}/comments/${commentId}`);
}