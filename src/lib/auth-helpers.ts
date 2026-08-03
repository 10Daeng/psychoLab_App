import { jwtVerify } from 'jose';

export async function verifyAdminSession(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { role: string; organization_id: string | null };
  } catch (error) {
    return null;
  }
}
