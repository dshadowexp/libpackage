import { verify } from "jsonwebtoken";
/**
 * Verifies the JWT token.
 * 
 * @param authToken - The authentication token to verify.
 * @returns The decoded token or an empty string if the token is invalid.
 */
export const verifyJWT = (secret: string) => (authToken: string | undefined) => {
    if (!authToken) {
      return '';
    }
  
    return verify(authToken, secret, { algorithms: ['HS256'] });
}