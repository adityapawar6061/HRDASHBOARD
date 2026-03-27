const { supabase } = require('../config/supabase');

const punchIn = async (userId, { latitude, longitude, device_info }) => {
  // Check for open punch-in
  const { data: open } = await supabase
    .from('attendance_logs')
    .select('id')
    .eq('user_id', userId)
    .is('punch_out_time', null)
    .single();

  if (open) throw { status: 409, message: 'Already punched in. Please punch out first.' };

  const { data, error } = await supabase
    .from('attendance_logs')
    .insert({
      user_id: userId,
      punch_in_time: new Date().toISOString(),
      punch_in_lat: latitude,
      punch_in_lng: longitude,
      device_info
    })
    .select()
    .single();

  if (error) throw { status: 500, message: error.message };
  return data;
};

const punchOut = async (userId, { latitude, longitude }) => {
  const { data: open } = await supabase
    .from('attendance_logs')
    .select('id')
    .eq('user_id', userId)
    .is('punch_out_time', null)
    .single();

  if (!open) throw { status: 409, message: 'No active punch-in found.' };

  const { data, error } = await supabase
    .from('attendance_logs')
    .update({
      punch_out_time: new Date().toISOString(),
      punch_out_lat: latitude,
      punch_out_lng: longitude
    })
    .eq('id', open.id)
    .select()
    .single();

  if (error) throw { status: 500, message: error.message };
  return data;
};

const getLogs = async ({ userId, date, page = 1, limit = 20 }) => {
  let query = supabase
    .from('attendance_logs')
    .select('*, users(name, email)', { count: 'exact' })
    .order('punch_in_time', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (userId) query = query.eq('user_id', userId);
  if (date) {
    const start = `${date}T00:00:00.000Z`;
    const end = `${date}T23:59:59.999Z`;
    query = query.gte('punch_in_time', start).lte('punch_in_time', end);
  }

  const { data, error, count } = await query;
  if (error) throw { status: 500, message: error.message };
  return { logs: data, total: count, page, limit };
};

module.exports = { punchIn, punchOut, getLogs };
