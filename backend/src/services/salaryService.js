const { supabase } = require('../config/supabase');

const getSalaries = async (userId) => {
  let query = supabase
    .from('salaries')
    .select('*, users(name, email)')
    .order('month', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw { status: 500, message: error.message };
  return data;
};

const generatePayslip = async ({ userId, month, per_day_pay, deductions = 0 }) => {
  // Count working days from attendance_logs for the month
  const start = `${month}-01T00:00:00.000Z`;
  const end = new Date(new Date(start).setMonth(new Date(start).getMonth() + 1)).toISOString();

  const { data: logs, error: logError } = await supabase
    .from('attendance_logs')
    .select('id')
    .eq('user_id', userId)
    .gte('punch_in_time', start)
    .lt('punch_in_time', end)
    .not('punch_out_time', 'is', null);

  if (logError) throw { status: 500, message: logError.message };

  const total_days = logs.length;
  const total_salary = total_days * per_day_pay - deductions;

  const { data, error } = await supabase
    .from('salaries')
    .upsert({ user_id: userId, month, total_days, per_day_pay, deductions, total_salary })
    .select('*, users(name, email)')
    .single();

  if (error) throw { status: 500, message: error.message };
  return data;
};

module.exports = { getSalaries, generatePayslip };
