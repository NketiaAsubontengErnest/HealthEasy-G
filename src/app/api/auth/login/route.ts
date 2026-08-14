import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/auth';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/session';
import { clientIp } from '@/lib/api-guard';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const ipAddress = clientIp(req);

    // 1. Fetch user by email from PostgreSQL
    const user = await prisma.userStaff.findUnique({
      where: { email: String(email).toLowerCase().trim() }
    });

    if (!user) {
      // Log the attempt without an actor link — the email may not belong to
      // any staff member — and return the same message as a bad password so
      // the response cannot be used to enumerate valid accounts.
      await prisma.auditLog.create({
        data: {
          userName: 'Unknown',
          role: 'Unknown',
          action: 'LOGIN_FAILED',
          details: `Authentication attempt for unregistered email ${String(email).toLowerCase().trim()}`,
          ipAddress
        }
      });

      return NextResponse.json({ error: 'Invalid user credentials.' }, { status: 401 });
    }

    // 2. Verify password with bcrypt
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          role: user.role,
          action: 'LOGIN_FAILED',
          details: `Failed authentication attempt for ${user.email}`,
          ipAddress
        }
      });

      return NextResponse.json({ error: 'Invalid user credentials.' }, { status: 401 });
    }

    // 3. Refuse suspended or deactivated staff accounts
    if (user.status && user.status.toLowerCase() !== 'active') {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          role: user.role,
          action: 'LOGIN_BLOCKED',
          details: `Sign-in blocked — staff account status is "${user.status}"`,
          ipAddress
        }
      });

      return NextResponse.json(
        { error: `This staff account is not active (status: ${user.status}). Contact HR.` },
        { status: 403 }
      );
    }

    // 4. Record successful login audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'LOGIN_SUCCESS',
        details: `Successful login as ${user.role} (${user.department})`,
        ipAddress
      }
    });

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hierarchyLevel: user.hierarchyLevel,
      staffId: user.staffId,
      department: user.department
    };

    // 5. Issue a signed, httpOnly session cookie. The browser never receives
    //    anything it could edit to change its own role.
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: { ...profile, status: user.status }
    });

    response.cookies.set(SESSION_COOKIE, await createSessionToken(profile), sessionCookieOptions());

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server authentication error' }, { status: 500 });
  }
}
