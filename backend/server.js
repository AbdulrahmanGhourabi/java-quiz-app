const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('./config/db');
const quizRoutes = require('./routes/quizRoutes');

const app    = express();
const SECRET = 'javamaster_secret_key_2024';

app.use(cors());
app.use(express.json());


const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};


app.post('/api/signup', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: 'All fields are required' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  try {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length > 0)
      return res.status(409).json({ message: 'Email or username already in use' });

    const hash = await bcrypt.hash(password, 10);
    const safeRole = role === 'teacher' ? 'teacher' : 'student';

    await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hash, safeRole]
    );

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0)
      return res.status(401).json({ message: 'Invalid email or password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id:         user.id,
        username:   user.username,
        email:      user.email,
        role:       user.role,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});


app.post('/api/profile/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: 'Both current and new passwords are required' });
  if (newPassword.length < 6)
    return res.status(400).json({ message: 'New password must be at least 6 characters' });

  try {
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match)
      return res.status(401).json({ message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});


app.use('/api/quiz', auth, quizRoutes);


app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});


app.listen(5000, () => {
  console.log('🚀 JavaMaster server running at http://localhost:5000');
});