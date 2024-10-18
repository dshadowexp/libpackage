import { Request, Response, NextFunction, ErrorRequestHandler, RequestHandler } from "express";
import { Logger } from "winston";

/**
 * @description Logs the request method and URL.
 * @param logger - The logger instance.
 * @returns A middleware function that logs the request method and URL.
 */
export const logRequests = (logger: Logger) => (req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url}`);
    next();
}

/**
 * Middleware to authenticate a request using a JWT token.
 * 
 * @param decodeToken - The function to decode the token.
 * @returns A middleware function that authenticates the request using the token.
 */
export const authenticate = (decodeToken: (token: string) => (Promise<any> | any)) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { authorization } = req.headers;
        if (!authorization) {
            return res.status(401).json({ error: "Authorization header is missing" });
        }

        const token = authorization.split(" ")[1];

        // Verify token and extract user info
        const decodedToken = await decodeToken(token);
        req.user = decodedToken;

        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

/**
 * Middleware to authorize a request based on user roles.
 * 
 * @param allowedRoles - An array of allowed roles.
 * @returns A middleware function that checks if the user has one of the allowed roles.
 */
export const authorize = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { role } = req.user!;

        if (allowedRoles.length > 0) {
            if (!allowedRoles.find(r => r === role)) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        }

        next();
    };
};


/**
 * Middleware to handle asynchronous request handlers.
 * 
 * @param fn - The asynchronous request handler function.
 * @returns A middleware function that wraps the asynchronous handler.
 */
export const asyncHandler = (fn: RequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Middleware to handle route not found errors.
 * 
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next function to call.
 */
export const notFound: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

/**
 * Middleware to handle errors.
 * 
 * @param logger - The logger instance.
 * @returns A middleware function that logs the error and sends a 500 response.
 */
export const error = (logger: Logger) => (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
};