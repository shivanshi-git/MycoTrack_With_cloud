// /**
//  * cognitoConfig.js
//  * Central AWS Cognito configuration
//  */

// export const COGNITO = {
//   domain:       "eu-north-1n61okwd0o.auth.eu-north-1.amazoncognito.com",
//   clientId:     "3mgmm695ofhku6ffdkidommvos",
//   redirectUri:  "myapp://signin",
//   responseType: "code",
//   scope:        "email openid phone",
// };

// // ── URL builders ──────────────────────────────────────────────────────────────

// const base = (path) =>
//   `https://${COGNITO.domain}/${path}` +
//   `?client_id=${COGNITO.clientId}` +
//   `&redirect_uri=${encodeURIComponent(COGNITO.redirectUri)}` +
//   `&response_type=${COGNITO.responseType}` +
//   `&scope=${encodeURIComponent(COGNITO.scope)}`;

// export const LOGIN_URL  = base("login");
// export const SIGNUP_URL = base("signup");
// export const LOGOUT_URL =
//   `https://${COGNITO.domain}/logout` +
//   `?client_id=${COGNITO.clientId}` +
//   `&logout_uri=${encodeURIComponent(COGNITO.redirectUri)}`;

// // ── Token exchange (Authorization Code → tokens) ──────────────────────────────

// export const exchangeCodeForTokens = async (code) => {
//   const body = new URLSearchParams({
//     grant_type:   "authorization_code",
//     client_id:    COGNITO.clientId,
//     redirect_uri: COGNITO.redirectUri,
//     code,
//   });

//   const res = await fetch(`https://${COGNITO.domain}/oauth2/token`, {
//     method:  "POST",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body:    body.toString(),
//   });

//   if (!res.ok) {
//     const err = await res.text();
//     throw new Error(`Token exchange failed: ${err}`);
//   }

//   return res.json();
//   // Returns: { access_token, id_token, refresh_token, expires_in, token_type }
// };



/**
 * cognitoConfig.js
 * Central AWS Cognito configuration
 * Location: src/AWS/cognitoConfig.js   (OUTSIDE app/ folder)
 */

export const COGNITO = {
  domain:       "eu-north-1n61okwd0o.auth.eu-north-1.amazoncognito.com",
  clientId:     "3mgmm695ofhku6ffdkidommvos",
  redirectUri:  "myapp://signin",
  responseType: "code",
  scope:        "email openid phone",
};

// ── URL builders ──────────────────────────────────────────────────────────────

const base = (path) =>
  `https://${COGNITO.domain}/${path}` +
  `?client_id=${COGNITO.clientId}` +
  `&redirect_uri=${encodeURIComponent(COGNITO.redirectUri)}` +
  `&response_type=${COGNITO.responseType}` +
  `&scope=${encodeURIComponent(COGNITO.scope)}`;

export const LOGIN_URL  = base("login");
export const SIGNUP_URL = base("signup");
export const LOGOUT_URL =
  `https://${COGNITO.domain}/logout` +
  `?client_id=${COGNITO.clientId}` +
  `&logout_uri=${encodeURIComponent(COGNITO.redirectUri)}`;

// ── Token exchange (Authorization Code → tokens) ──────────────────────────────

export const exchangeCodeForTokens = async (code) => {
  const body = new URLSearchParams({
    grant_type:   "authorization_code",
    client_id:    COGNITO.clientId,
    redirect_uri: COGNITO.redirectUri,
    code,
  });

  const res = await fetch(`https://${COGNITO.domain}/oauth2/token`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return res.json();
  // Returns: { access_token, id_token, refresh_token, expires_in, token_type }
};