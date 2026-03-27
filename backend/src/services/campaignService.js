const { supabase } = require('../config/supabase');

const getAll = async () => {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      companies(id, name),
      campaign_assignments(
        user_id,
        users(id, name, email)
      )
    `)
    .order('created_at', { ascending: false });
  if (error) throw { status: 500, message: error.message };

  // For each campaign, check which assigned users are currently punched in
  const campaignIds = data.map(c => c.id);
  if (campaignIds.length === 0) return data;

  // Get all open punch-ins for assigned users across these campaigns
  const allUserIds = [...new Set(data.flatMap(c => c.campaign_assignments.map(a => a.user_id)))];

  let activeLogs = [];
  if (allUserIds.length > 0) {
    const { data: logs } = await supabase
      .from('attendance_logs')
      .select('user_id, punch_in_time, campaign_id')
      .in('user_id', allUserIds)
      .is('punch_out_time', null);
    activeLogs = logs || [];
  }

  // Attach punched_in status to each assignment
  return data.map(campaign => ({
    ...campaign,
    campaign_assignments: campaign.campaign_assignments.map(a => ({
      ...a,
      is_punched_in: activeLogs.some(l => l.user_id === a.user_id),
      punch_in_time: activeLogs.find(l => l.user_id === a.user_id)?.punch_in_time || null,
    }))
  }));
};

const create = async (fields) => {
  const { name, description, company_id, location_lat, location_lng, location_radius_meters,
    min_hours, salary_per_min_hours, start_datetime, end_datetime, timezone } = fields;
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      name, description, company_id: company_id || null,
      location_lat, location_lng, location_radius_meters,
      min_hours, salary_per_min_hours,
      start_datetime: start_datetime || null,
      end_datetime: end_datetime || null,
      timezone: timezone || 'Asia/Kolkata'
    })
    .select('*, companies(id, name)')
    .single();
  if (error) throw { status: 500, message: error.message };
  return data;
};

const update = async (id, fields) => {
  const { name, description, company_id, location_lat, location_lng, location_radius_meters,
    min_hours, salary_per_min_hours, start_datetime, end_datetime, timezone } = fields;
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      name, description, company_id: company_id || null,
      location_lat, location_lng, location_radius_meters,
      min_hours, salary_per_min_hours,
      start_datetime: start_datetime || null,
      end_datetime: end_datetime || null,
      timezone: timezone || 'Asia/Kolkata'
    })
    .eq('id', id)
    .select('*, companies(id, name)')
    .single();
  if (error) throw { status: 500, message: error.message };
  return data;
};

const remove = async (id) => {
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw { status: 500, message: error.message };
};

const assignEmployee = async (campaignId, userId) => {
  const { data, error } = await supabase
    .from('campaign_assignments')
    .upsert({ campaign_id: campaignId, user_id: userId })
    .select()
    .single();
  if (error) throw { status: 500, message: error.message };
  return data;
};

const removeEmployee = async (campaignId, userId) => {
  const { error } = await supabase
    .from('campaign_assignments')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('user_id', userId);
  if (error) throw { status: 500, message: error.message };
};

module.exports = { getAll, create, update, remove, assignEmployee, removeEmployee };
