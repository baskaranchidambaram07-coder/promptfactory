const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

/**
 * Verifies a JWT issued specifically for the admin portal
 * (token.type === 'admin_portal').
 */
const requireAdminAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'admin_portal')
      return res.status(401).json({ error: 'Invalid token type' });

    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, name, email, role, is_active')
      .eq('id', decoded.id)
      .single();

    if (error || !admin || !admin.is_active)
      return res.status(401).json({ error: 'Account not found or inactive' });

    req.adminUser = admin;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Restricts a route to specific admin roles.
 * Use after requireAdminAuth.
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.adminUser?.role))
    return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

module.exports = { requireAdminAuth, requireRole };
