const { supabase } = require('../config/supabase');
const logger = require('../config/logger');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    logger.warn('Auth failed', { error: error?.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single();

  req.user = profile || { id: user.id, email: user.email, role: 'employee' };
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
