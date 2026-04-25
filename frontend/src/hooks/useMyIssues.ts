import { useEffect, useState } from 'react';
import type { ProjectDto, IssueDto } from '@/types';
import { listProjects } from '@/api/projects';
import { listProjectIssues } from '@/api/issues';
import { useAuthStore } from '@/stores/authStore';

export function useMyIssues() {
  const user = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [myIssues, setMyIssues] = useState<IssueDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetch() {
      try {
        setIsLoading(true);
        const projs = await listProjects();
        if (cancelled) return;

        const allIssues: IssueDto[] = [];
        await Promise.all(
          projs.map(async (p) => {
            const issues = await listProjectIssues(p.id, { assigneeId: user!.id });
            allIssues.push(...issues);
          }),
        );

        if (!cancelled) {
          setProjects(projs);
          setMyIssues(allIssues);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [user]);

  return { projects, myIssues, isLoading };
}