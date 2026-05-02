import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { PhaseDto, CreatePhaseRequest, UpdatePhaseRequest, DeliverableDto, CreateDeliverableRequest, UpdateDeliverableRequest } from '@/types';

// Phases

export function listPhases(projectId: number): Promise<PhaseDto[]> {
  return apiGet(`/projects/${projectId}/phases`);
}

export function createPhase(projectId: number, data: CreatePhaseRequest): Promise<PhaseDto> {
  return apiPost(`/projects/${projectId}/phases`, data);
}

export function updatePhase(projectId: number, phaseId: number, data: UpdatePhaseRequest): Promise<PhaseDto> {
  return apiPut(`/projects/${projectId}/phases/${phaseId}`, data);
}

export function deletePhase(projectId: number, phaseId: number): Promise<void> {
  return apiDelete(`/projects/${projectId}/phases/${phaseId}`);
}

// Deliverables

export function listDeliverables(projectId: number, phaseId?: number): Promise<DeliverableDto[]> {
  const params = phaseId ? `?phaseId=${phaseId}` : '';
  return apiGet(`/projects/${projectId}/deliverables${params}`);
}

export function createDeliverable(projectId: number, data: CreateDeliverableRequest): Promise<DeliverableDto> {
  return apiPost(`/projects/${projectId}/deliverables`, data);
}

export function updateDeliverable(projectId: number, id: number, data: UpdateDeliverableRequest): Promise<DeliverableDto> {
  return apiPut(`/projects/${projectId}/deliverables/${id}`, data);
}

export function deleteDeliverable(projectId: number, id: number): Promise<void> {
  return apiDelete(`/projects/${projectId}/deliverables/${id}`);
}