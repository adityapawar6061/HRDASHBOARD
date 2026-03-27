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
  return data;
};

const create = async (fields) => {
  const { name, description, company_id, location_lat, location_lng, location_radius_meters, min_hours, salary_per_min_hours } = fields;
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ name, description, company_id: company_id || null, location_lat, location_lng, location_radius_meters, min_hours, salary_per_min_hours })
    .select('*, companies(id, name)')
    .single();
  if (error) throw { status: 500, message: error.message };
  return data;
};

const update = async (id, fields) => {
  const { name, description, company_id, location_lat, location_lng, location_radius_meters, min_hours, salary_per_min_hours } = fields;
  const { data, error } = await supabase
    .from('campaigns')
    .update({ name, description, company_id: company_id || null, location_lat, location_lng, location_radius_meters, min_hours, salary_per_min_hours })
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
