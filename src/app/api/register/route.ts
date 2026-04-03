import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one letter and one number" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (!existing.password) {
        return NextResponse.json(
          { error: "This email is linked to a social login. Please sign in with Google or GitHub." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
      },
    });

    // Create verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(email, token);

    if (!emailResult.success) {
      console.error("[Register] Email send failed:", emailResult.error);
      // Account created but email failed — still return success
      // They can resend from the verify-email page
      return NextResponse.json(
        {
          message: "Account created but verification email could not be sent. You can request a new one.",
          emailSent: false,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { message: "Account created. Check your email to verify.", emailSent: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
