import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  createEmailPasswordUser,
  hashPassword,
  validateEmail,
  validatePassword,
} from "@/lib/auth-provisioning";
import { logPipelineEvent } from "@/lib/logging";

type RegisterRequest = {
  email: string;
  password: string;
};

type RegisterSuccess = {
  ok: true;
};

type RegisterError = {
  ok: false;
  code:
    | "registration_disabled"
    | "registration_not_configured"
    | "invalid_email"
    | "weak_password"
    | "email_not_allowed"
    | "account_exists"
    | "invalid_json"
    | "internal_error";
  message: string;
};

function isEmailRegistrationEnabled(): boolean {
  return (process.env.AUTH_ENABLE_EMAIL_REGISTRATION ?? "false").toLowerCase() === "true";
}

function getAllowedRegistrationEmails(): string[] {
  return (process.env.EMAIL_REGISTRATION_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isEmailAllowed(email: string, allowlist: string[]): boolean {
  const normalized = email.trim().toLowerCase();
  return allowlist.includes(normalized);
}

export async function POST(request: NextRequest): Promise<NextResponse<RegisterSuccess | RegisterError>> {
  // Check if registration is enabled
  if (!isEmailRegistrationEnabled()) {
    logPipelineEvent("registration_disabled", {});
    return NextResponse.json(
      {
        ok: false,
        code: "registration_disabled",
        message: "Registration is not enabled for this app.",
      },
      { status: 403 },
    );
  }

  // Check if allowlist is configured
  const allowlist = getAllowedRegistrationEmails();
  if (allowlist.length === 0) {
    logPipelineEvent("registration_not_configured", {});
    return NextResponse.json(
      {
        ok: false,
        code: "registration_not_configured",
        message: "Registration is enabled but no allowed emails are configured.",
      },
      { status: 503 },
    );
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logPipelineEvent("registration_invalid_json", {});
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_json",
        message: "Request body is invalid.",
      },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null) {
    logPipelineEvent("registration_invalid_json", {});
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_json",
        message: "Request body is invalid.",
      },
      { status: 400 },
    );
  }

  const { email, password } = body as Partial<RegisterRequest>;

  if (typeof email !== "string" || typeof password !== "string") {
    logPipelineEvent("registration_invalid_json", {});
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_json",
        message: "Request body is invalid.",
      },
      { status: 400 },
    );
  }

  // Validate email
  const emailError = validateEmail(email);
  if (emailError) {
    logPipelineEvent("registration_invalid_email", { email: email.trim() });
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_email",
        message: emailError,
      },
      { status: 400 },
    );
  }

  // Validate password
  const passwordError = validatePassword(password);
  if (passwordError) {
    logPipelineEvent("registration_weak_password", {});
    return NextResponse.json(
      {
        ok: false,
        code: "weak_password",
        message: passwordError,
      },
      { status: 400 },
    );
  }

  // Check if email is allowed
  if (!isEmailAllowed(email, allowlist)) {
    logPipelineEvent("registration_email_not_allowed", { email: email.trim().toLowerCase() });
    return NextResponse.json(
      {
        ok: false,
        code: "email_not_allowed",
        message: "This email is not allowed for this private app.",
      },
      { status: 403 },
    );
  }

  // Hash password
  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch (error) {
    logPipelineEvent("registration_hash_error", { error: String(error) });
    return NextResponse.json(
      {
        ok: false,
        code: "internal_error",
        message: "Could not create the account right now. Please try again.",
      },
      { status: 500 },
    );
  }

  // Create user
  try {
    const { id } = await createEmailPasswordUser({
      email: email.trim().toLowerCase(),
      passwordHash,
    });

    logPipelineEvent("registration_success", { userId: id, email: email.trim().toLowerCase() });

    return NextResponse.json(
      {
        ok: true,
      },
      { status: 201 },
    );
  } catch (error) {
    const errorMessage = String(error);

    if (errorMessage.includes("account_exists")) {
      logPipelineEvent("registration_account_exists", { email: email.trim().toLowerCase() });
      return NextResponse.json(
        {
          ok: false,
          code: "account_exists",
          message: "That email already has an account. Sign in instead.",
        },
        { status: 409 },
      );
    }

    logPipelineEvent("registration_internal_error", { error: errorMessage });
    return NextResponse.json(
      {
        ok: false,
        code: "internal_error",
        message: "Could not create the account right now. Please try again.",
      },
      { status: 500 },
    );
  }
}
