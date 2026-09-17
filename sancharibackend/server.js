import app, { httpServer } from './app.js';

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    httpServer.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on port ${PORT}`));
}

export default app;
