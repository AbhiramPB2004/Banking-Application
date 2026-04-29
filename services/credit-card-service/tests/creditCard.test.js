/**
 * /services/credit-card-service/tests/creditCard.test.js
 * Testing requirements for PostgreSQL-backed infrastructure[cite: 2485].
 */
const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('../index'); 
const { sequelize } = require('../../shared/config/db'); //

describe('Credit Card Service Integration Tests (PostgreSQL)', () => {
    
    // Ensure database is synced before running tests
    before(async () => {
        await sequelize.sync({ force: true }); //
    });

    describe('POST /apply', () => {
        it('should fail if KYC is not verified (Eligibility Check)', async () => {
            const res = await request(app)
                .post('/api/credit-cards/apply')
                .set('Authorization', 'Bearer valid_jwt_token') // [cite: 552, 1454]
                .send({
                    requested_limit: 50000,
                    annual_income: 400000,
                    employment_type: 'salaried' // [cite: 2461]
                });
            
            // Expected failure based on eligibility simulation [cite: 2463]
            expect(res.status).to.equal(400); 
            expect(res.body.success).to.be.false; 
        });

        it('should correctly assign a credit limit for valid applications', async () => {
            const res = await request(app)
                .post('/api/credit-cards/apply')
                .set('Authorization', 'Bearer verified_user_jwt')
                .send({
                    requested_limit: 100000,
                    annual_income: 1200000,
                    employment_type: 'salaried'
                });

            expect(res.status).to.equal(201);
            expect(res.body.data).to.have.property('card_number'); // [cite: 2468]
            expect(res.body.data.status).to.equal('active'); // [cite: 2468]
            expect(parseFloat(res.body.data.credit_limit)).to.equal(100000); // 
        });
    });

    describe('POST /purchase (Transaction Simulation)', () => {
        it('should reject transactions that exceed the available limit', async () => {
            const res = await request(app)
                .post('/api/credit-cards/purchase')
                .set('Authorization', 'Bearer verified_user_jwt')
                .send({
                    card_id: 'existing_card_uuid',
                    amount: 200000 // Higher than limit
                });

            // Standardized limit validation failure [cite: 2469]
            expect(res.status).to.equal(400); 
            expect(res.body.errors).to.include('Limit validation failed'); 
        });
    });

    // Cleanup after tests
    after(async () => {
        await sequelize.close(); //
    });
});