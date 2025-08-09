import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  const { USER_ID, PASSWORD, JWT_SECRET } = process.env;

  if (!USER_ID || !PASSWORD || !JWT_SECRET) {
    throw new Error("Missing environment variables for auth.");
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }


  if (email === USER_ID && password === PASSWORD) {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '60d' });
    return res.status(200).json({ token });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
};
