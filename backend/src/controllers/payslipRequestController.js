const { supabase } = require('../config/supabase');

const requestPayslip = async (req, res, next) => {
  try {
    const { month } = req.body;
    const { data, error } = await supabase
      .from('payslip_requests')
      .upsert({ user_id: req.user.id, month, status: 'pending', requested_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw { status: 500, message: error.message };
    res.status(201).json(data);
  } catch (err) { next(err); }
};

const getRequests = async (req, res, next) => {
  try {
    let query = supabase
      .from('payslip_requests')
      .select('*, users(name, email)')
      .order('requested_at', { ascending: false });
    if (req.user.role !== 'admin') query = query.eq('user_id', req.user.id);
    const { data, error } = await query;
    if (error) throw { status: 500, message: error.message };
    res.json(data);
  } catch (err) { next(err); }
};

const reviewRequest = async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const { data, error } = await supabase
      .from('payslip_requests')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw { status: 500, message: error.message };
    res.json(data);
  } catch (err) { next(err); }
};

module.exports = { requestPayslip, getRequests, reviewRequest };
