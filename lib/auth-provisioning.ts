import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { DEFAULT_EXAM_READINESS_SKILLS } from "@/lib/exam-map";

/**
 * Generates a username from an email address.
 * Rule: local part before @ -> lowercase -> replace non a-z/0-9/_/- with _ -> trim _ -> fallback "learner"
 */
function generateUsernameFromEmail(email: string): string {
  const localPart = email.split("@")[0] || "";
  const normalized = localPart
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "learner";
}

/**
 * Finds an available username by appending numeric suffixes if conflicts exist.
 * Tries base, base_2, base_3, ... base_20
 */
async function findAvailableUsername(baseUsername: string): Promise<string | null> {
  const existing = await db.user.findUnique({
    where: { username: baseUsername },
    select: { id: true },
  });

  if (!existing) {
    return baseUsername;
  }

  for (let suffix = 2; suffix <= 20; suffix++) {
    const candidate = `${baseUsername}_${suffix}`;
    const existingWithSuffix = await db.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });

    if (!existingWithSuffix) {
      return candidate;
    }
  }

  return null;
}

/**
 * Ensures the user has LearnerProfile and ExamReadinessMap scaffolding.
 */
export async function ensureUserLearningScaffold(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      examMap: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.profile) {
    await db.learnerProfile.create({
      data: {
        userId,
      },
    });
  }

  if (!user.examMap) {
    await db.examReadinessMap.create({
      data: {
        userId,
        skills: DEFAULT_EXAM_READINESS_SKILLS,
      },
    });
  }
}

/**
 * Creates a new email/password user with full learning scaffold.
 * Returns the user ID on success.
 * Throws an error if email already exists or username cannot be allocated.
 */
export async function createEmailPasswordUser(input: {
  email: string;
  passwordHash: string;
}): Promise<{ id: string }> {
  const { email, passwordHash } = input;

  // Check if email already exists
  const existingUser = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("account_exists");
  }

  // Generate username
  const baseUsername = generateUsernameFromEmail(email);
  const availableUsername = await findAvailableUsername(baseUsername);

  if (!availableUsername) {
    throw new Error("internal_error");
  }

  // Create user with scaffold in a transaction
  const user = await db.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        username: availableUsername,
        email: email.toLowerCase(),
        passwordHash,
        authProvider: "email",
        allowlisted: true,
      },
    });

    await tx.learnerProfile.create({
      data: {
        userId: newUser.id,
      },
    });

    await tx.examReadinessMap.create({
      data: {
        userId: newUser.id,
        skills: DEFAULT_EXAM_READINESS_SKILLS,
      },
    });

    return newUser;
  });

  return { id: user.id };
}

/**
 * Hashes a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Validates an email address.
 * Returns null if valid, or an error message if invalid.
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return "Enter a valid email address.";
  }

  if (trimmed.length > 254) {
    return "Enter a valid email address.";
  }

  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) {
    return "Enter a valid email address.";
  }

  const [localPart, domainPart] = trimmed.split("@");

  if (!localPart || localPart.trim().length === 0) {
    return "Enter a valid email address.";
  }

  if (!domainPart || domainPart.trim().length === 0) {
    return "Enter a valid email address.";
  }

  if (!domainPart.includes(".")) {
    return "Enter a valid email address.";
  }

  return null;
}

/**
 * Validates a password.
 * Returns null if valid, or an error message if invalid.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 12) {
    return "Use at least 12 characters with a letter and a number.";
  }

  if (password.length > 128) {
    return "Use at least 12 characters with a letter and a number.";
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return "Use at least 12 characters with a letter and a number.";
  }

  return null;
}
