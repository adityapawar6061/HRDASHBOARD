const { supabase } = require('../config/supabase');

const getAll = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw { status: 500, message: error.message };
  return data;
};

const create = async ({ name, address_line1, address_line2 }) => {
  const { data, error } = await supabase
    .from('companies')
    .insert({ name, address_line1, address_line2 })
    .select()
    .single();
  if (error) throw { status: 500, message: error.message };
  return data;
};

const update = async (id, { name, address_line1, address_line2 }) => {
  const { data, error } = await supabase
    .from('companies')
    .update({ name, address_line1, address_line2 })
    .eq('id', id)
    .select()
    .single();
  if (error) throw { status: 500, message: error.message };
  return data;
};

const remove = async (id) => {
  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) throw { status: 500, message: error.message };
};

module.exports = { getAll, create, update, remove };
