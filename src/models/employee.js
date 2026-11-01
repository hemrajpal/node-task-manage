'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Employee.hasMany(models.Task, {
        foreignKey: "employeeId",
        as: "tasks"
      })
    }
  }
  Employee.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {msg: 'Must be a valid email address'},
        notNull: { msg: 'Email is required' },
        notEmpty: { msg: 'Email cannot be empty' }
      }
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    salary: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      validate: {
        min: {
          args: [0.01], // Must be strictly greater than 0
          msg: "Salary must be greater than 0."
        }
      }
      
    },
    createdAt: { 
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    }
  }, {
    sequelize,
    modelName: 'Employee',
    tableName: "employees",
    underscored: true
  });
  return Employee;
};