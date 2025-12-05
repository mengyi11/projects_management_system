// app/api/admin/allocation/stats/route.js
import { NextResponse } from 'next/server';
import { handleError } from '@/lib/errorHandler';
import { getAllocationStats } from '@/services/allocation.service';

export const GET = async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const semester_id = searchParams.get('semester_id');
    if (!semester_id) {
      return NextResponse.json({ ok: false, error: 'Semester ID is required' }, { status: 400 });
    }

    const stats = await getAllocationStats(semester_id);
    return NextResponse.json({ ok: true, data: stats });
  } catch (error) {
    return handleError(error);
  }
};