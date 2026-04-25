import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { WikiPageDto, WikiTreeItem, CreateWikiPageRequest, UpdateWikiPageRequest, WikiSearchHit } from '@/types';

export async function getWikiPageTree(projectId: number): Promise<WikiTreeItem[]> {
  return apiGet<WikiTreeItem[]>(`/projects/${projectId}/wiki/pages`);
}

export async function getWikiPage(projectId: number, pageId: number): Promise<WikiPageDto> {
  return apiGet<WikiPageDto>(`/projects/${projectId}/wiki/pages/${pageId}`);
}

export async function createWikiPage(projectId: number, request: CreateWikiPageRequest): Promise<WikiPageDto> {
  return apiPost<WikiPageDto>(`/projects/${projectId}/wiki/pages`, request);
}

export async function updateWikiPage(projectId: number, pageId: number, request: UpdateWikiPageRequest): Promise<WikiPageDto> {
  return apiPut<WikiPageDto>(`/projects/${projectId}/wiki/pages/${pageId}`, request);
}

export async function deleteWikiPage(projectId: number, pageId: number): Promise<void> {
  await apiDelete(`/projects/${projectId}/wiki/pages/${pageId}`);
}

export async function searchWikiPages(projectId: number, query: string): Promise<WikiSearchHit[]> {
  return apiGet<WikiSearchHit[]>(`/projects/${projectId}/wiki/search`, { q: query });
}