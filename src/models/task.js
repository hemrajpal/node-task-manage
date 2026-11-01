'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Task.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      })
      Task.belongsTo(models.Project, {
        foreignKey: 'projectId',
        as: 'project'
      })
    }
  }
  Task.init({
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "project_id"
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "employee_id"
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
      defaultValue: "pending"
    }
  }, {
    sequelize,
    modelName: 'Task',
    tableName: "tasks",
    underscored: true
  });
  return Task;
};