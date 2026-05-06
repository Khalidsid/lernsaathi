import { db } from "@/lib/db";
import { DEFAULT_EXAM_READINESS_SKILLS } from "@/lib/exam-map";

function getAdminUsername() {
  const username = process.env.ADMIN_USERNAME?.trim();

  if (!username) {
    throw new Error("Missing ADMIN_USERNAME");
  }

  return username;
}

export async function ensureSeededUser() {
  const username = getAdminUsername();

  let existingUser = await db.user.findUnique({
    where: { username },
    include: {
      profile: true,
      examMap: true,
    },
  });

  if (!existingUser) {
    existingUser = await db.user.create({
      data: {
        username,
      },
      include: {
        profile: true,
        examMap: true,
      },
    });
  }

  if (!existingUser.profile) {
    await db.learnerProfile.create({
      data: {
        userId: existingUser.id,
      },
    });
  }

  if (!existingUser.examMap) {
    await db.examReadinessMap.create({
      data: {
        userId: existingUser.id,
        skills: DEFAULT_EXAM_READINESS_SKILLS,
      },
    });
  }

  return db.user.findUniqueOrThrow({
    where: { username },
    include: {
      profile: true,
      examMap: true,
    },
  });
}
