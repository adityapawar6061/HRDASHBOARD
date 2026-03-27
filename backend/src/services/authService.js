const { supabase, supabaseAnon } = require('../config/supabase');

const login = async (email, password) => {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error) throw { status: 401, message: error.message };

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', data.user.id)
    .single();

  return { token: data.session.access_token, user: profile };
};

const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', userId)
    .single();
  if (error) throw { status: 404, message: 'User not found' };
  return data;
};

module.exports = { login, getProfile };
