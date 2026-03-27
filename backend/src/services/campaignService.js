const { supabase } = require('../config/supabase');

const getAll = async () => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, campaign_assignments(user_id, users(name, email))')
    .order('created_at', { ascending: false });
  if (error) throw { status: 500, message: error.message };
  return data;
};

const create = async ({ name, description }) => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ name, description })
    .select()
    .single();
  if (error) throw { status: 500, message: error.message };
  return data;
};

const update = async (id, { name, description }) => {
  const { data, error } = await supabase
    .from('campaigns')
    .update({ name, description })
    .eq('id', id)
    .select()
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
