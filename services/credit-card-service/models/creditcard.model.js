/**
 * /services/credit-card-service/models/creditCard.model.js
 * Defines relational schema for cardholder mapping.
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../shared/config/db'); // [cite: 1602]

const CreditCard = sequelize.define('CreditCard', {
    card_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, // 
    user_id: { type: DataTypes.UUID, allowNull: false, index: true }, // 
    linked_account_id: { type: DataTypes.UUID, allowNull: false }, // 
    card_number: { type: DataTypes.STRING, unique: true, allowNull: false }, // 
    card_type: { type: DataTypes.STRING, allowNull: false }, // 
    credit_limit: { type: DataTypes.DECIMAL(15, 2), allowNull: false }, // 
    available_limit: { type: DataTypes.DECIMAL(15, 2), allowNull: false }, // 
    outstanding_balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 }, // 
    minimum_due: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 }, // 
    billing_cycle_date: { type: DataTypes.INTEGER, allowNull: false }, // 
    status: { 
        type: DataTypes.ENUM('active', 'blocked', 'closed'), 
        defaultValue: 'active' 
    } // 
});

module.exports = CreditCard;