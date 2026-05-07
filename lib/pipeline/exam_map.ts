type SkillValue = "unknown" | "weak" | "medium" | "strong";
type SkillSection = Record<string, SkillValue>;
type ExamSkills = Record<string, SkillSection>;

function cloneSkills(currentSkills: unknown): ExamSkills {
  if (!currentSkills || typeof currentSkills !== "object" || Array.isArray(currentSkills)) {
    return {};
  }

  return JSON.parse(JSON.stringify(currentSkills)) as ExamSkills;
}

function bumpSection(section: SkillSection) {
  for (const key of Object.keys(section)) {
    if (section[key] === "unknown") {
      section[key] = "weak";
    }
  }
}

export function updateExamReadinessSkills(currentSkills: unknown, hiddenExamImpactKeys: string[]) {
  const nextSkills = cloneSkills(currentSkills);

  for (const impactKey of hiddenExamImpactKeys) {
    const [sectionKey, skillKey] = impactKey.split(".");
    const section = nextSkills[sectionKey];

    if (!section) {
      continue;
    }

    if (!skillKey) {
      bumpSection(section);
      continue;
    }

    if (section[skillKey] === "unknown") {
      section[skillKey] = "weak";
    }
  }

  return nextSkills;
}
