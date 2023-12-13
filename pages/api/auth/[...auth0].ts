import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

export default handleAuth({
  async logout(req, res) {
    await handleLogout(req, res, {
      returnTo: process.env.POST_LOGOUT_REDIRECT_URI,
    });
  },
  async login(req, res) {
    await handleLogin(req, res, {
      returnTo: process.env.AUTH0_BASE_URL,
      authorizationParams: {
        audience: process.env.AUTH0_API_AUDIENCE,
        client_id: process.env.AUTH0_CLIENT_ID,
        scope: 'openid profile email offline_access',
      },
    });
  },
});
