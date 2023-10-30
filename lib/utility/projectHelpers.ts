import { ProjectSummary, ProjectSummaryItem } from '../models/summaryDataModel';

export const getProjectName = (
  projects: Record<string, ProjectSummary | string>,
  projectId: string
): string | null => {
  const key = Object.keys(projects.allProjects).filter((key) =>
    key.includes(projectId)
  )[0];
  const project = (projects.allProjects as ProjectSummary)[key];
  if (project) {
    return project.projectName as string;
  }
  return null;
};

export const getAllProjectIds = (allProjects: ProjectSummary) => {
  const activeProjectIds = Object.entries(allProjects)
    .map(([key, value]) => {
      if (value.isActive) {
        return key.split('::').at(-1);
      }
    })
    .filter((el) => el !== undefined);
  return activeProjectIds;
};
