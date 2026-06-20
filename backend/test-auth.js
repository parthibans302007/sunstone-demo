const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('./server');
const User = require('./models/User');
const RefreshToken = require('./models/RefreshToken');

const getCookie = (res, cookieName) => {
    const cookies = res.headers['set-cookie'];
    if (!cookies) return null;
    const cookie = cookies.find(c => c.startsWith(`${cookieName}=`));
    if (!cookie) return null;
    return cookie.split(';')[0];
};

const runTests = async () => {
    console.log('--- STARTING AUTH & RBAC INTEGRATION TESTS ---');
    
    // Wait for DB connection to initialize
    await new Promise(resolve => {
        if (mongoose.connection.readyState === 1) {
            resolve();
        } else {
            mongoose.connection.once('open', resolve);
        }
    });

    const testEmail = 'integration-test-user@sunstone.com';
    const testAdminEmail = 'integration-test-admin@sunstone.com';

    try {
        // Clean up any existing test users
        await User.deleteMany({ email: { $in: [testEmail, testAdminEmail] } });
        
        console.log('\n[TEST 1] User Registration...');
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Integration Test Student',
                email: testEmail,
                password: 'password123',
                role: 'student'
            });
        
        if (regRes.status !== 201) {
            throw new Error(`Registration failed: ${regRes.status} - ${JSON.stringify(regRes.body)}`);
        }
        console.log('✅ Registration success');

        // Create an admin user for RBAC testing
        await User.create({
            name: 'Integration Test Admin',
            email: testAdminEmail,
            password: 'password123',
            role: 'admin'
        });

        console.log('\n[TEST 2] User Login...');
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testEmail,
                password: 'password123'
            });

        if (loginRes.status !== 200) {
            throw new Error(`Login failed: ${loginRes.status} - ${JSON.stringify(loginRes.body)}`);
        }
        
        const accessToken = loginRes.body.token;
        const refreshTokenCookie = getCookie(loginRes, 'refreshToken');

        if (!accessToken) {
            throw new Error('Access Token missing in login response body');
        }
        if (!refreshTokenCookie) {
            throw new Error('Refresh Token cookie missing in login response headers');
        }
        console.log('✅ Login success (Received access token & refresh cookie)');

        console.log('\n[TEST 3] Accessing Profile with Access Token...');
        const profileRes = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${accessToken}`);

        if (profileRes.status !== 200) {
            throw new Error(`Profile access failed: ${profileRes.status} - ${JSON.stringify(profileRes.body)}`);
        }
        console.log('✅ Profile accessed successfully');

        console.log('\n[TEST 4] RBAC Protection (Student accessing Admin route)...');
        const rbacRes = await request(app)
            .get('/api/categories')
            .set('Authorization', `Bearer ${accessToken}`);
        
        // A student should not be allowed to access categories (requires admin/faculty)
        if (rbacRes.status === 200 || rbacRes.status === 201) {
            throw new Error(`RBAC failure: Student was able to access admin/faculty categories route! Status: ${rbacRes.status}`);
        }
        console.log(`✅ RBAC verified: Student access to categories was correctly restricted (Status: ${rbacRes.status})`);

        console.log('\n[TEST 5] Token Refresh & Rotation...');
        // Wait 1 second to ensure timestamps differ
        await new Promise(resolve => setTimeout(resolve, 1000));

        const refreshRes = await request(app)
            .post('/api/auth/refresh')
            .set('Cookie', [refreshTokenCookie]);

        if (refreshRes.status !== 200) {
            throw new Error(`Refresh failed: ${refreshRes.status} - ${JSON.stringify(refreshRes.body)}`);
        }

        const newAccessToken = refreshRes.body.token;
        const newRefreshTokenCookie = getCookie(refreshRes, 'refreshToken');

        if (!newAccessToken) {
            throw new Error('New access token missing in refresh response');
        }
        if (!newRefreshTokenCookie) {
            throw new Error('New refresh token cookie missing in refresh response');
        }
        if (newAccessToken === accessToken) {
            throw new Error('Access token was not updated/rotated');
        }
        if (newRefreshTokenCookie === refreshTokenCookie) {
            throw new Error('Refresh token was not rotated');
        }
        console.log('✅ Token Refresh & Rotation success (Received new access token & new refresh cookie)');

        console.log('\n[TEST 6] Refresh Token Reuse Detection...');
        const reuseRes = await request(app)
            .post('/api/auth/refresh')
            .set('Cookie', [refreshTokenCookie]);

        if (reuseRes.status !== 401) {
            throw new Error(`Reuse detection failure: Old refresh token was still accepted! Status: ${reuseRes.status}`);
        }
        console.log('✅ Reuse detection verified (Old refresh token was rejected)');

        console.log('\n[TEST 7] User Logout...');
        const logoutRes = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', [newRefreshTokenCookie]);

        if (logoutRes.status !== 200) {
            throw new Error(`Logout failed: ${logoutRes.status} - ${JSON.stringify(logoutRes.body)}`);
        }
        
        const rawCookies = logoutRes.headers['set-cookie'] || [];
        const rawClearedCookie = rawCookies.find(c => c.startsWith('refreshToken='));
        if (rawClearedCookie && !rawClearedCookie.includes('Max-Age=0') && !rawClearedCookie.toLowerCase().includes('expires=')) {
            throw new Error('Refresh Token cookie was not cleared on logout');
        }
        console.log('✅ Logout success (Cookie cleared)');

        console.log('\n[TEST 8] Access Profile after Logout...');
        const refreshAfterLogoutRes = await request(app)
            .post('/api/auth/refresh')
            .set('Cookie', [newRefreshTokenCookie]);

        if (refreshAfterLogoutRes.status !== 401) {
            throw new Error(`Refresh after logout failed to reject: Status: ${refreshAfterLogoutRes.status}`);
        }
        console.log('✅ Session ended successfully (Refresh after logout was rejected)');

        // Clean up test users
        await User.deleteMany({ email: { $in: [testEmail, testAdminEmail] } });
        console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');

    } catch (err) {
        console.error('\n❌ TEST RUN FAILED:', err.message);
        process.exitCode = 1;
    } finally {
        // Close DB connection and HTTP server
        await mongoose.connection.close();
        if (server.listening) {
            await new Promise(resolve => server.close(resolve));
        }
        console.log('Test cleanup completed. Connection closed.');
    }
};

runTests();
