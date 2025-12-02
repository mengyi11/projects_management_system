const venueManager = require('@/services/venue.service');
import { handleError } from '@/lib/errorHandler';

/**
 * GET 接口：获取指定学期的场地列表
 * @param {Request} req - 请求对象
 * @returns {Response} - 场地列表响应
 */
export const GET = async (req) => {
  try {
    console.log("route: getVenuesBySemester");

    // 解析查询参数（学期ID）
    const url = new URL(req.url);
    const semesterId = url.searchParams.get('semester_id');

    // 验证参数
    if (!semesterId || isNaN(semesterId)) {
      throw new Error('Missing or invalid semester_id (must be a number)', { cause: { statusCode: 400 } });
    }

    // 调用服务层获取数据
    const venues = await venueManager.getVenuesBySemester(Number(semesterId));

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Venues fetched successfully',
        data: venues
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
};

/**
 * POST 接口：创建单个场地
 * @param {Request} req - 请求对象（包含场地信息）
 * @returns {Response} - 创建结果响应
 */
export const POST = async (req) => {
  try {
    console.log("route: createVenue");

    // 解析请求体
    const venueData = await req.json();
    const { name, location, capacity, semester_id } = venueData;

    console.log(semester_id)

    // 验证必填参数
    if (!name || !location || capacity === undefined || !semester_id) {
      throw new Error('Missing required fields (name, location, capacity, semester_id)', { cause: { statusCode: 400 } });
    }
    if (isNaN(capacity) || capacity <= 0) {
      throw new Error('Capacity must be a positive number', { cause: { statusCode: 400 } });
    }
    if (isNaN(semester_id)) {
      throw new Error('Invalid semester_id (must be a number)', { cause: { statusCode: 400 } });
    }

    // 调用服务层创建场地
    const result = await venueManager.createVenue({
      name,
      location,
      capacity: Number(capacity),
      semester_id: Number(semester_id)
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Venue created successfully',
        data: result
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
};

/**
 * PUT 接口：更新场地信息
 * @param {Request} req - 请求对象（包含更新信息）
 * @param {Object} params - 路由参数（包含场地ID）
 * @returns {Response} - 更新结果响应
 */
export const PUT = async (req, { params }) => {
  try {
    console.log("route: updateVenue");

    // 1. 解析路由参数（无需 await params！Next.js 14+ params 是普通对象）
    // const { id: venueIdStr } = params; // 修正：移除 await，params 直接解构
    // console.log("xx:"+ venueIdStr)
    // const venueId = Number(venueIdStr);


    // const param = await params;
    // const venueIdStr = param.venueId;
    // if (!venueIdStr) {
    //   throw new Error('Venue ID is required (append to URL: /api/admin/venues?venueId=123)', { cause: { statusCode: 400 } });
    // }

    // // 2. 验证场地ID（增强校验：避免非数字字符串）
    // if (isNaN(venueId) || venueId <= 0 || !Number.isInteger(venueId)) {
    //   throw new Error('Invalid venue ID (must be a positive integer)', { cause: { statusCode: 400 } });
    // }

    // 3. 解析请求体（添加错误捕获，避免无效 JSON）
    let updateData;
    try {
      updateData = await req.json();
    } catch (jsonError) {
      throw new Error('Invalid request body (must be valid JSON)', { cause: { statusCode: 400 } });
    }



    const { name, location, capacity, semester_id, venueId } = updateData;

    console.log("updateData:=------", updateData)

    // 4. 验证更新参数（优化：允许单独更新部分字段，而非必须全量更新）
    const validFields = {};
    if (name) validFields.name = name.trim(); // 去空格
    if (location) validFields.location = location.trim(); // 去空格
    if (capacity !== undefined) {
      const capacityNum = Number(capacity);
      if (isNaN(capacityNum) || capacityNum <= 0 || !Number.isInteger(capacityNum)) {
        throw new Error('Capacity must be a positive integer', { cause: { statusCode: 400 } });
      }
      validFields.capacity = capacityNum;
    }
    if (semester_id !== undefined) {
      const semesterIdNum = Number(semester_id);
      if (isNaN(semesterIdNum) || semesterIdNum <= 0 || !Number.isInteger(semesterIdNum)) {
        throw new Error('Invalid semester_id (must be a positive integer)', { cause: { statusCode: 400 } });
      }
      validFields.semester_id = semesterIdNum;
    }

    // 验证是否有有效更新字段
    if (Object.keys(validFields).length === 0) {
      throw new Error('No valid fields to update (name/location/capacity/semester_id)', { cause: { statusCode: 400 } });
    }

    // 5. 调用服务层更新场地（确保 venueManager.updateVenue 存在且正确）
    const result = await venueManager.updateVenue(venueId, validFields);

    // 6. 验证更新结果（避免更新失败但无错误抛出）
    if (!result) {
      throw new Error('Venue not found or failed to update', { cause: { statusCode: 404 } });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Venue updated successfully',
        data: result
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
};

/**
 * DELETE 接口：删除场地
 * @param {Object} params - 路由参数（包含场地ID）
 * @returns {Response} - 删除结果响应
 */
export const DELETE = async (req, { params }) => {
  try {
    console.log("route: deleteVenue");

    // 解析路由参数（场地ID）
    // const { id: venueIdStr } = await params;
    // const venueId = Number(venueIdStr);

    const url = new URL(req.url);
    const venueIdStr = url.searchParams.get('venue_id');
    console.log("venue_id:", venueIdStr);
    const venueId = Number(venueIdStr);

    // 验证场地ID
    if (isNaN(venueId) || venueId <= 0) {
      throw new Error('Invalid venue ID (must be a positive number)', { cause: { statusCode: 400 } });
    }

    // 调用服务层删除场地
    const result = await venueManager.deleteVenue(venueId);

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Venue deleted successfully',
        data: result
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
};