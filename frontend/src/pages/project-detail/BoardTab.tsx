import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IssueDto, IssueStatusDto } from '@/types';
import { listProjectIssues, updateIssue } from '@/api/issues';
import { listIssueStatuses } from '@/api/admin';
import { priorityColor, statusColor } from '@/utils/format';
import { useAuthStore } from '@/stores/authStore';
import Spinner from '@/components/common/Spinner';

export default function BoardTab({ projectId, projectKey, isExternal }: { projectId: number; projectKey: string; isExternal?: boolean }) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [issues, setIssues] = useState<IssueDto[]>([]);
  const [statuses, setStatuses] = useState<IssueStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTargetStatusId, setDropTargetStatusId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const columnRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [issueData, statusData] = await Promise.all([
        listProjectIssues(projectId, { size: 200 }),
        listIssueStatuses(),
      ]);
      setIssues(issueData);
      setStatuses(statusData.sort((a, b) => a.position - b.position));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const issuesByStatus = statuses.map((status) => ({
    status,
    issues: issues.filter((i) => i.statusId === status.id),
  }));

  const handleDragStart = (issueId: number) => {
    setDraggingId(issueId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTargetStatusId(null);
  };

  const handleDragOver = (e: React.DragEvent, statusId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetStatusId(statusId);
  };

  const handleDragLeave = () => {
    setDropTargetStatusId(null);
  };

  const handleDrop = async (statusId: number) => {
    if (draggingId === null) return;
    const issue = issues.find((i) => i.id === draggingId);
    if (!issue || issue.statusId === statusId) {
      setDraggingId(null);
      setDropTargetStatusId(null);
      return;
    }

    // Optimistically update UI
    setIssues((prev) =>
      prev.map((i) => (i.id === issue.id ? { ...i, statusId, statusName: statuses.find((s) => s.id === statusId)!.name } : i)),
    );
    setDraggingId(null);
    setDropTargetStatusId(null);
    setUpdating(true);

    try {
      await updateIssue(projectId, issue.id, { statusId });
    } catch {
      // Revert on failure
      setIssues((prev) =>
        prev.map((i) => (i.id === issue.id ? { ...i, statusId: issue.statusId, statusName: issue.statusName } : i)),
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;

  return (
    <div className="relative">
      {updating && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <Spinner className="h-3 w-3" /> Updating...
          </span>
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 280px)' }}>
        {issuesByStatus.map(({ status, issues: columnIssues }) => (
          <div
            key={status.id}
            ref={(el) => { columnRefs.current[status.id] = el; }}
            className={`flex-shrink-0 w-72 flex flex-col bg-gray-50 rounded-xl border-2 transition-colors ${
              dropTargetStatusId === status.id ? 'border-primary-400 bg-primary-50' : 'border-transparent'
            }`}
            onDragOver={(e) => handleDragOver(e, status.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(status.id)}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(status.name)}`}>{status.name}</span>
                <span className="text-xs text-gray-400">{columnIssues.length}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {columnIssues.map((issue) => (
                <div
                  key={issue.id}
                  draggable={!isExternal || (issue.external && (issue.reporterId === currentUser?.id || issue.assigneeId === currentUser?.id))}
                  onDragStart={() => handleDragStart(issue.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => navigate(`/projects/${projectId}/issues/${issue.id}`)}
                  className={`bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all ${
                    draggingId === issue.id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-primary-600">{issue.issueKey}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityColor(issue.priority)}`}>{issue.priority}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 leading-snug mb-1.5">{issue.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{issue.typeName}</span>
                    {issue.assigneeName && <span>{issue.assigneeName}</span>}
                  </div>
                </div>
              ))}
              {columnIssues.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-400">
                  {draggingId !== null ? 'Drop issue here' : 'No issues'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}