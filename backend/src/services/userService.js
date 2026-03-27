const { supabase } = require('../config/supabase');

const getAll = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .order('created_at', { ascending: false });
  if (error) throw { status: 500, message: error.message };
  return data;
};

const createEmployee = async ({ name, email, password }) => {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (authError) throw { status: 400, message: authError.message };

  const { data, error } = await supabase
    .from('users')
    .insert({ id: authData.user.id, name, email, role: 'employee' })
    .select()
    .single();
  if (error) throw { status: 500, message: error.message };
  return data;
};

module.exports = { getAll, createEmployee };
