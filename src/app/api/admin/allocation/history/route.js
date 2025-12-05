// app/api/admin/allocation/history/route.js
import { NextResponse } from 'next/server';
import { handleError } from '@/lib/errorHandler';
import { getAllocationHistory } from '@/services/allocation.service';

export const GET = async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const semester_id = searchParams.get('semester_id');
    if (!semester_id) {
      return NextResponse.json({ ok: false, error: 'Semester ID is required' }, { status: 400 });
    }

    const history = await getAllocationHistory(semester_id);
    return NextResponse.json({ ok: true, data: history });
  } catch (error) {
    return handleError(error);
  }
};