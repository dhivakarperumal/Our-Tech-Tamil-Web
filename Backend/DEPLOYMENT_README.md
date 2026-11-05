# OURTECHX cPanel deployment update

## Main correction
This build starts the Express listener as soon as cPanel/Passenger loads `index.js`. It does not rely on `require.main === module`, which can be false when Passenger loads the startup file. It also starts MySQL initialization after the HTTP listener is ready, so the root URL can respond to cPanel's availability check even if MySQL configuration/schema initialization has a problem.

## cPanel settings
- Application root: `Tech_Backend`
- Startup file: `index.js`
- Node.js: 18+ (use a version supported by cPanel)
- Application URL: `ourtechx.qtechx.com`
- Extract the ZIP contents directly into `Tech_Backend`, so `index.js` and `package.json` are directly inside it.
- Run NPM Install, then Restart.

## Environment variables
Keep the existing database values only if they exactly match the cPanel MySQL Databases page:
- NODE_ENV=production
- BACKEND_URL=https://ourtechx.qtechx.com
- DB_HOST=localhost
- DB_PORT=3306
- DB_NAME=exact cPanel database name
- DB_USER=exact cPanel database username
- DB_PASSWORD=new database password
- JWT_SECRET=random secret with at least 32 characters
- JWT_EXPIRES_IN=7d

Do not set JWT_SECRET to `7d`. `7d` is the token expiry and belongs in JWT_EXPIRES_IN. PORT should normally be supplied by the hosting environment; remove the manually entered PORT=5000 if your cPanel provider does not explicitly instruct you to set it.

## Test
- `https://ourtechx.qtechx.com/` should return HTTP 200 JSON.
- `https://ourtechx.qtechx.com/api/health` should return database connected when MySQL is reachable.
- If root responds but health returns 503, inspect `logs/passenger.log` and correct the MySQL DB name/user/password/privileges.

## If the cPanel NPM Install action still shows the same message
Open `Tech_Backend/logs/passenger.log` and copy the latest complete error/stack trace. Also check cPanel Setup Node.js App for the selected Node version and the exact application root. The red toast itself is only a generic availability-check failure and does not identify the underlying exception.

## Security
The DB password and JWT secret were visible in screenshots. Change both after deployment, update cPanel environment variables, then restart the application. The original `.env` and `node_modules` are intentionally excluded from this ZIP.
