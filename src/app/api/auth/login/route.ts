import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 1. Fetch user by email from PostgreSQL
    const user = await prisma.userStaff.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid user credentials.' },
        { status: 401 }
      );
    }

    // 2. Verify password with bcrypt
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Record failed audit log entry in PostgreSQL
      await prisma.auditLog.create({
        data: {
          userName: user.name,
          role: user.role,
          action: 'LOGIN_FAILED',
          details: `Failed authentication attempt for ${user.email}`,
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        }
      });

      return NextResponse.json(
        { error: 'Invalid user credentials.' },
        { status: 401 }
      );
    }

    // 3. Record successful login audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'LOGIN_SUCCESS',
        details: `Successful login as ${user.role} (${user.department})`,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
      }
    });

    // 4. Return user details & role scope
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hierarchyLevel: user.hierarchyLevel,
        staffId: user.staffId,
        department: user.department,
        status: user.status
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server authentication error' },
      { status: 500 }
    );
  }
}
