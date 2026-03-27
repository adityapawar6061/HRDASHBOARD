const { supabase } = require('../config/supabase');

const getSalaries = async (userId) => {
  let query = supabase
    .from('salaries')
    .select('*, users(name, email), salary_campaign_breakdowns(*)')
    .order('month', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw { status: 500, message: error.message };
  return data;
};

const generatePayslip = async ({ userId, month, deductions = 0 }) => {
  const start = `${month}-01T00:00:00.000Z`;
  const end = new Date(new Date(start).setMonth(new Date(start).getMonth() + 1)).toISOString();

  // Get all campaigns this user is assigned to
  const { data: assignments, error: assignErr } = await supabase
    .from('campaign_assignments')
    .select('campaign_id, campaigns(id, name, min_hours, salary_per_min_hours)')
    .eq('user_id', userId);
  if (assignErr) throw { status: 500, message: assignErr.message };

  // Get all completed attendance logs for this user this month
  const { data: logs, error: logErr } = await supabase
    .from('attendance_logs')
    .select('id, campaign_id, punch_in_time, punch_out_time')
    .eq('user_id', userId)
    .gte('punch_in_time', start)
    .lt('punch_in_time', end)
    .not('punch_out_time', 'is', null);
  if (logErr) throw { status: 500, message: logErr.message };

  // Calculate per-campaign breakdown
  const breakdowns = [];
  let total_salary = 0;
  let total_hours = 0;
  let total_days = 0;

  for (const assignment of assignments) {
    const campaign = assignment.campaigns;
    if (!campaign) continue;

    // Filter logs for this campaign
    const campaignLogs = logs.filter(l => l.campaign_id === campaign.id);

    // Calculate total hours worked in this campaign
    let campaignHours = 0;
    const uniqueDays = new Set();

    for (const log of campaignLogs) {
      const ms = new Date(log.punch_out_time) - new Date(log.punch_in_time);
      campaignHours += ms / 3600000;
      uniqueDays.add(log.punch_in_time.split('T')[0]);
    }

    // Salary = floor(hours / min_hours) * salary_per_min_hours
    const minHours = parseFloat(campaign.min_hours) || 5;
    const salaryPerSlot = parseFloat(campaign.salary_per_min_hours) || 500;
    const slots = Math.floor(campaignHours / minHours);
    const salary_earned = slots * salaryPerSlot;

    breakdowns.push({
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      total_hours: parseFloat(campaignHours.toFixed(2)),
      total_days: uniqueDays.size,
      salary_earned
    });

    total_salary += salary_earned;
    total_hours += campaignHours;
    total_days += uniqueDays.size;
  }

  // Handle logs with no campaign (general attendance)
  const noCampaignLogs = logs.filter(l => !l.campaign_id);
  if (noCampaignLogs.length > 0) {
    let hours = 0;
    const days = new Set();
    for (const log of noCampaignLogs) {
      hours += (new Date(log.punch_out_time) - new Date(log.punch_in_time)) / 3600000;
      days.add(log.punch_in_time.split('T')[0]);
    }
    breakdowns.push({
      campaign_id: null,
      campaign_name: 'General (No Campaign)',
      total_hours: parseFloat(hours.toFixed(2)),
      total_days: days.size,
      salary_earned: 0
    });
    total_hours += hours;
    total_days += days.size;
  }

  const net_salary = Math.max(0, total_salary - parseFloat(deductions));

  // Upsert salary record
  const { data: salaryRecord, error: salaryErr } = await supabase
    .from('salaries')
    .upsert({
      user_id: userId,
      month,
      total_days,
      total_hours: parseFloat(total_hours.toFixed(2)),
      per_day_pay: 0, // kept for schema compat
      deductions: parseFloat(deductions),
      total_salary: net_salary
    })
    .select('*, users(name, email)')
    .single();
  if (salaryErr) throw { status: 500, message: salaryErr.message };

  // Delete old breakdowns and re-insert
  await supabase.from('salary_campaign_breakdowns').delete().eq('salary_id', salaryRecord.id);

  if (breakdowns.length > 0) {
    const { error: bdErr } = await supabase
      .from('salary_campaign_breakdowns')
      .insert(breakdowns.map(b => ({ ...b, salary_id: salaryRecord.id })));
    if (bdErr) throw { status: 500, message: bdErr.message };
  }

  return { ...salaryRecord, salary_campaign_breakdowns: breakdowns };
};

module.exports = { getSalaries, generatePayslip };
