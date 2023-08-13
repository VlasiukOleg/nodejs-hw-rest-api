const axios = require('axios');
// const request = require('supertest');
// const app = require('../app');

// const User = require('../models/users');



describe('test Login controller', () => {
    let user;
    let token;
    const testUser = {
        email: 'test@gmail.com', 
        password: 'test1234'
    }

    beforeEach( async ()=> {
       user = await axios.post('http://localhost:3000/api/users/register', testUser)
    })

    afterEach( async () => {
        const id = user.data.user.id;
        const config = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
        await axios.delete(`http://localhost:3000/api/users/${id}`, config);
    })
    
    
    test('request must return  status 200', async () => {
        const response = await axios.post('http://localhost:3000/api/users/login', testUser);
        token = response.data.token;
        expect(response.status).toBe(200);
    })


    test('request must return token', async () => {
        const response = await axios.post('http://localhost:3000/api/users/login', testUser);
        token = response.data.token;
        expect(response.data.token).toBeTruthy();
        // expect(response.data).toHaveProperty("token");
    })

    test('request must return object User with two fields email and subscription with type: String', async () => {
        const response = await axios.post('http://localhost:3000/api/users/login', testUser);
        token = response.data.token;
        const user = response.data.user;
        expect(typeof user).toBe('object')
        expect(typeof user.email).toBe('string');
        expect(typeof user.subscription).toBe('string');
    })




})