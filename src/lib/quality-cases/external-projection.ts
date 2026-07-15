import {
  getQualityCaseTaskVisibleSections,
  type QualityCaseTaskType,
  type QualityCaseVisibleSection,
} from "@/lib/quality-cases/contract";

export type QualityCaseExternalProjection = Partial<Record<QualityCaseVisibleSection, unknown>>;

/**
 * Projects a case only through the task's fixed allowlist. Callers must supply
 * data by section; passing a broad case object is intentionally impossible.
 */
export function projectQualityCaseForExternalTask(
  taskType: QualityCaseTaskType,
  sections: Partial<Record<QualityCaseVisibleSection, unknown>>,
): QualityCaseExternalProjection {
  const projected: QualityCaseExternalProjection = {};
  for (const section of getQualityCaseTaskVisibleSections(taskType)) {
    projected[section] = sections[section];
  }
  return projected;
}
