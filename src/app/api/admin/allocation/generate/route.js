// app/api/admin/allocation/generate/route.js
import { NextResponse } from 'next/server';
import { handleError } from '@/lib/errorHandler';
import { generateAllocation } from '@/services/allocation.service';

export const POST = async (req) => {
  try {
    const { semester_id } = await req.json();
    if (!semester_id) {
      return NextResponse.json({ ok: false, error: 'Semester ID is required' }, { status: 400 });
    }

    const result = await generateAllocation(semester_id);
    console.log("---------------------------------------")
    console.log(result)
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return handleError(error);
  }
};