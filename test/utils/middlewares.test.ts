import assert from 'node:assert/strict';
import { it, describe, mock } from 'node:test';
import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../src/utils/middlewares';  // Adjust path as needed

// Type definitions
interface MockRequest extends Partial<Request> {
    headers: {
        [key: string]: string | undefined;
    };
    user?: {
        uid: string;
        role: string;
    };
}

interface MockResponse {
    statusCode?: number;
    body?: any;
    status(code: number): this;
    json(data: any): this;
}

type DecodedToken = {
    uid: string;
    role: string;
};

type TokenDecoder = (token: string) => Promise<DecodedToken>;

describe("authentication middleware", () => {
    // Mock factory functions
    const mockRequest = (headers: { [key: string]: string } = {}): MockRequest => ({
        headers,
        user: undefined
    });

    const mockResponse = (code?: number, body?: Record<string, string>): MockResponse => {
        const res: MockResponse = {
            statusCode: code,
            body: body,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            json(data: any) {
                this.body = data;
                return this;
            }
        };
        return res;
    };

    const mockNext = (): NextFunction => 
        mock.fn() as unknown as NextFunction;

    // Mock token decoder functions
    const validDecoder: TokenDecoder = async (token: string): Promise<DecodedToken> => ({
        uid: 'user123',
        role: 'admin'
    });

    const invalidDecoder: TokenDecoder = async (token: string): Promise<DecodedToken> => {
        throw new Error('Invalid token');
    };

    it('should authenticate valid token', async () => {
        // Arrange
        const req: MockRequest = mockRequest({
            authorization: 'Bearer valid-token'
        });
        const res = mockResponse();
        const next: NextFunction = mockNext();
        const middleware = authenticate(validDecoder);

        // Act
        await middleware(req as Request, res as Response, next);

        // Assert
        assert.deepStrictEqual(req.user, {
            uid: 'user123',
            role: 'admin'
        });
        assert.equal(res.statusCode, undefined);
        assert.equal(res.body, undefined);
    });
    
    it('should reject request with missing authorization header', async () => {
        // Arrange
        const req: MockRequest = mockRequest();
        const res = mockResponse();
        const next: NextFunction = mockNext();
        const middleware = authenticate(validDecoder);
    
        // Act
        await middleware(req as Request, res as Response, next);
    
        // Assert
        assert.equal(res.statusCode, 401);
        assert.deepStrictEqual(res.body, {
            error: 'Authorization header is missing'
        });
    });
    
    it('should reject invalid token format', async () => {
        // Arrange
        const req: MockRequest = mockRequest({
            authorization: 'invalid-format'
        });
        const res = mockResponse(401, {
            error: 'Invalid or expired token'
        });
        const next: NextFunction = mockNext();
        const middleware = authenticate(validDecoder);
    
        // Act
        await middleware(req as Request, res as Response, next);
    
        // Assert
        assert.equal(res.statusCode, 401);
        assert.deepStrictEqual(res.body, {
            error: 'Invalid or expired token'
        });
    });
    
    it('should reject invalid token', async () => {
        // Arrange
        const req: MockRequest = mockRequest({
            authorization: 'Bearer invalid-token'
        });
        const res = mockResponse();
        const next: NextFunction = mockNext();
        const middleware = authenticate(invalidDecoder);
    
        // Act
        await middleware(req as Request, res as Response, next);
    
        // Assert
        assert.equal(res.statusCode, 401);
        assert.deepStrictEqual(res.body, {
            error: 'Invalid or expired token'
        });
    });
});
