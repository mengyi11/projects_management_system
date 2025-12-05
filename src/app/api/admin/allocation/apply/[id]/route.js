// app/api/admin/allocation/apply/[id]/route.js
import { NextResponse } from 'next/server';
import { handleError } from '@/lib/errorHandler';
import { applyAllocation } from '@/services/allocation.service';

export const POST = async (req, { params }) => {
  try {
    const { id } = params;
    const result = await applyAllocation(id);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return handleError(error);
  }
};