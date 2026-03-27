const { supabase } = require('../config/supabase');

const getAll = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, company_id, created_at, companies(id, name)')
    .order('created_at', { ascending: false });
  if (error) throw { status: 500, message: error.message };
  return data;
};

const createEmployee = async ({ name, email, password, company_id }) => {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (authError) throw { status: 400, message: authError.message };

  const { data, error } = await supabase
    .from('users')
    .insert({ id: authData.user.id, name, email, role: 'employee', company_id: company_id || null })
    .select('id, name, email, role, company_id, companies(id, name)')
    .single();
  if (error) throw { status: 500, message: error.message };
  return data;
};

module.exports = { getAll, createEmployee };
