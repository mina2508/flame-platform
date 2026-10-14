// Local / container entry point. On Vercel the app is served via api/index.js.
import app from './app.js';

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`FLAME API running on port ${PORT}`));
