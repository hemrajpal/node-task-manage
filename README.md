# Node.js + Express + Sequelize + MySQL

## 1. Create project and install packages

```bash
mkdir employee-management
cd employee-management

npm init -y

npm install express sequelize mysql2 dotenv
npm install --save-dev sequelize-cli nodemon
```

Initialize Sequelize CLI:

```bash
npx sequelize-cli init
```

Generated structure:

```text
config/
  config.json
models/
migrations/
seeders/
```

## 2. Create MySQL database

```sql
CREATE DATABASE employee_management;
```

Create `.env`:

```env
PORT=5000

DB_HOST=localhost
DB_NAME=employee_management
DB_USER=root
DB_PASSWORD=
DB_DIALECT=mysql
```

## 3. Configure Sequelize database connection

Rename `config/config.json` to `config/config.js`.

```js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT
  }
};
```

Create `.sequelizerc` in the root directory:

```js
const path = require('path');

module.exports = {
  config: path.resolve('config', 'config.js'),
  'models-path': path.resolve('models'),
  'seeders-path': path.resolve('seeders'),
  'migrations-path': path.resolve('migrations')
};
```

## 4. Generate models

We will create three main tables:

- Employee
- Project
- Task

```bash
npx sequelize-cli model:generate --name Employee --attributes name:string,email:string,department:string,salary:decimal
```

```bash
npx sequelize-cli model:generate --name Project --attributes name:string,description:text,employeeId:integer
```

```bash
npx sequelize-cli model:generate --name Task --attributes title:string,description:text,status:string,dueDate:date,projectId:integer,employeeId:integer
```

Each command generates a model and a migration.

## 5. Employee model

`models/employee.js`

```js
'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {

    static associate(models) {

      // One-to-Many
      Employee.hasMany(models.Project, {
        foreignKey: 'employeeId',
        as: 'projects'
      });

      Employee.hasMany(models.Task, {
        foreignKey: 'employeeId',
        as: 'tasks'
      });

    }
  }

  Employee.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Must be a valid email address'
        },
        notEmpty: {
          msg: 'Email is required'
        }
      }
    },

    department: {
      type: DataTypes.STRING,
      allowNull: false
    },

    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0.01],
          msg: 'Salary must be greater than 0'
        }
      }
    }

  }, {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    underscored: true
  });

  return Employee;
};
```

## 6. Project model

`models/project.js`

```js
'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class Project extends Model {

    static associate(models) {

      // Many-to-One
      Project.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      });

      // One-to-Many
      Project.hasMany(models.Task, {
        foreignKey: 'projectId',
        as: 'tasks'
      });

    }
  }

  Project.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }

  }, {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
    underscored: true
  });

  return Project;
};
```

## 7. Task model

`models/task.js`

```js
'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class Task extends Model {

    static associate(models) {

      // Many-to-One
      Task.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      });

      Task.belongsTo(models.Project, {
        foreignKey: 'projectId',
        as: 'project'
      });

    }
  }

  Task.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    status: {
      type: DataTypes.ENUM(
        'pending',
        'in_progress',
        'completed'
      ),
      defaultValue: 'pending'
    },

    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },

    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }

  }, {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    underscored: true
  });

  return Task;
};
```

## 8. Model associations

All relationships are defined in each model's `static associate(models)` method.

Our relationships:

```text
Employee
   |
   | hasMany
   |
   ├──────── Projects
   |             |
   |             | hasMany
   |             |
   |             └──────── Tasks
   |
   └──────── Tasks
```

| Relationship | Sequelize method |
|---|---|
| Employee → Projects | `hasMany()` |
| Project → Employee | `belongsTo()` |
| Project → Tasks | `hasMany()` |
| Task → Project | `belongsTo()` |
| Employee → Tasks | `hasMany()` |
| Task → Employee | `belongsTo()` |

## 9. Configure `models/index.js`

Keep the Sequelize CLI generated model-loading code.

The generated file already calls each model's `associate` method. Its important section should look like this:

```js
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
```

Do not define relationships again in `models/index.js`.

## 10. Create `app.js`

```js
require('dotenv').config();

const express = require('express');
const db = require('./models');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Database connection
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connected');

    return db.sequelize.sync();
  })
  .then(() => {
    console.log('Tables synchronized');

    app.listen(process.env.PORT || 5000, () => {
      console.log('Server running on port ' + (process.env.PORT || 5000));
    });
  })
  .catch(error => {
    console.error('Database connection failed:', error);
  });
```

## 11. Employee controller

Create `controllers/employeeController.js`.

```js
const { Employee, Project, Task } = require('../models');

// Create employee
exports.createEmployee = async (req, res) => {
  try {
    const employee = await Employee.create(req.body);

    res.status(201).json({
      success: true,
      data: employee
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get employees with pagination and relationships
exports.getEmployees = async (req, res) => {
  try {

    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 10, 1),
      100
    );

    const offset = (page - 1) * limit;

    const { count, rows } = await Employee.findAndCountAll({

      include: [
        {
          model: Project,
          as: 'projects'
        },
        {
          model: Task,
          as: 'tasks'
        }
      ],

      distinct: true,

      limit,
      offset,

      order: [['id', 'DESC']]

    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalRecords: count,
        currentPage: page,
        perPage: limit,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single employee
exports.getEmployee = async (req, res) => {
  try {

    const employee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          as: 'projects'
        },
        {
          model: Task,
          as: 'tasks'
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {

    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await employee.update(req.body);

    res.json({
      success: true,
      data: employee
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {

    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await employee.destroy();

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

## 12. Employee routes

Create `routes/employeeRoutes.js`.

```js
const express = require('express');

const router = express.Router();

const employeeController = require('../controllers/employeeController');

router.post('/', employeeController.createEmployee);

router.get('/', employeeController.getEmployees);

router.get('/:id', employeeController.getEmployee);

router.put('/:id', employeeController.updateEmployee);

router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
```

## 13. Project controller

Create `controllers/projectController.js`.

```js
const { Project, Employee, Task } = require('../models');

// Create project
exports.createProject = async (req, res) => {
  try {

    const project = await Project.create(req.body);

    res.status(201).json({
      success: true,
      data: project
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all projects with relationships
exports.getProjects = async (req, res) => {
  try {

    const projects = await Project.findAll({
      include: [
        {
          model: Employee,
          as: 'employee'
        },
        {
          model: Task,
          as: 'tasks'
        }
      ],
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: projects
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get project by ID
exports.getProject = async (req, res) => {
  try {

    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee'
        },
        {
          model: Task,
          as: 'tasks'
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.update(req.body);

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.destroy();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

## 14. Project routes

Create `routes/projectRoutes.js`.

```js
const express = require('express');

const router = express.Router();

const projectController = require('../controllers/projectController');

router.post('/', projectController.createProject);

router.get('/', projectController.getProjects);

router.get('/:id', projectController.getProject);

router.put('/:id', projectController.updateProject);

router.delete('/:id', projectController.deleteProject);

module.exports = router;
```

## 15. Task controller

Create `controllers/taskController.js`.

```js
const { Task, Employee, Project } = require('../models');

// Create task
exports.createTask = async (req, res) => {
  try {

    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      data: task
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all tasks with relationships
exports.getTasks = async (req, res) => {
  try {

    const tasks = await Task.findAll({
      include: [
        {
          model: Employee,
          as: 'employee'
        },
        {
          model: Project,
          as: 'project'
        }
      ]
    });

    res.json({
      success: true,
      data: tasks
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get task by ID
exports.getTask = async (req, res) => {
  try {

    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee'
        },
        {
          model: Project,
          as: 'project'
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {

    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.update(req.body);

    res.json({
      success: true,
      data: task
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {

    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

## 16. Task routes

Create `routes/taskRoutes.js`.

```js
const express = require('express');

const router = express.Router();

const taskController = require('../controllers/taskController');

router.post('/', taskController.createTask);

router.get('/', taskController.getTasks);

router.get('/:id', taskController.getTask);

router.put('/:id', taskController.updateTask);

router.delete('/:id', taskController.deleteTask);

module.exports = router;
```

## 17. Important Sequelize methods

### Create

```js
await Employee.create({
  name: 'Rahul',
  email: 'rahul@example.com',
  department: 'PHP',
  salary: 35000
});
```

### Find all

```js
const employees = await Employee.findAll();
```

### Find by primary key

```js
const employee = await Employee.findByPk(1);
```

### Find one with condition

```js
const employee = await Employee.findOne({
  where: {
    email: 'rahul@example.com'
  }
});
```

### Find all with condition

```js
const employees = await Employee.findAll({
  where: {
    department: 'PHP'
  }
});
```

### Select specific columns

```js
const employees = await Employee.findAll({
  attributes: ['id', 'name', 'email']
});
```

### Exclude columns

```js
const employees = await Employee.findAll({
  attributes: {
    exclude: ['password']
  }
});
```

### Order by

```js
const employees = await Employee.findAll({
  order: [['createdAt', 'DESC']]
});
```

### Limit and offset

```js
const employees = await Employee.findAll({
  limit: 10,
  offset: 0
});
```

### Search using LIKE

```js
const { Op } = require('sequelize');

const employees = await Employee.findAll({
  where: {
    name: {
      [Op.like]: '%rahul%'
    }
  }
});
```

### OR condition

```js
const employees = await Employee.findAll({
  where: {
    [Op.or]: [
      { department: 'PHP' },
      { department: 'Node.js' }
    ]
  }
});
```

### IN condition

```js
const employees = await Employee.findAll({
  where: {
    id: {
      [Op.in]: [1, 2, 3]
    }
  }
});
```

### BETWEEN condition

```js
const employees = await Employee.findAll({
  where: {
    salary: {
      [Op.between]: [20000, 50000]
    }
  }
});
```

### Count

```js
const total = await Employee.count();
```

### Find and count

```js
const { count, rows } = await Employee.findAndCountAll({
  limit: 10,
  offset: 0
});
```

## 18. Relationship fetching with `include`

### Employee with projects

```js
const employees = await Employee.findAll({
  include: [
    {
      model: Project,
      as: 'projects'
    }
  ]
});
```

### Employee with tasks

```js
const employees = await Employee.findAll({
  include: [
    {
      model: Task,
      as: 'tasks'
    }
  ]
});
```

### Project with employee

```js
const projects = await Project.findAll({
  include: [
    {
      model: Employee,
      as: 'employee'
    }
  ]
});
```

### Project with tasks

```js
const projects = await Project.findAll({
  include: [
    {
      model: Task,
      as: 'tasks'
    }
  ]
});
```

### Task with employee and project

```js
const tasks = await Task.findAll({
  include: [
    {
      model: Employee,
      as: 'employee'
    },
    {
      model: Project,
      as: 'project'
    }
  ]
});
```

### Filter using associated model

```js
const projects = await Project.findAll({
  include: [
    {
      model: Employee,
      as: 'employee',
      where: {
        department: 'PHP'
      }
    }
  ]
});
```

### Select associated columns

```js
const projects = await Project.findAll({
  include: [
    {
      model: Employee,
      as: 'employee',
      attributes: ['id', 'name', 'email']
    }
  ]
});
```

## 19. Update and delete examples

### Update by ID

```js
await Employee.update(
  {
    department: 'Node.js'
  },
  {
    where: {
      id: 1
    }
  }
);
```

### Delete by ID

```js
await Employee.destroy({
  where: {
    id: 1
  }
});
```

### Delete multiple records

```js
await Task.destroy({
  where: {
    status: 'completed'
  }
});
```

### Delete all records

```js
await Task.destroy({
  truncate: true
});
```

## 20. Create related records

### Create project for employee

```js
const employee = await Employee.findByPk(1);

const project = await employee.createProject({
  name: 'CRM Development',
  description: 'Build a CRM application'
});
```

This works because the association alias is `projects`.

### Create task for project

```js
const project = await Project.findByPk(1);

const task = await project.createTask({
  title: 'Create login API',
  description: 'Develop login endpoint',
  status: 'pending',
  employeeId: 1
});
```

This works because the association alias is `tasks`.

## 21. Middleware example

Create `middlewares/authMiddleware.js`:

```js
const authMiddleware = (req, res, next) => {

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  next();
};

module.exports = authMiddleware;
```

Use middleware for a group of routes:

```js
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', employeeController.getEmployees);

router.get('/:id', employeeController.getEmployee);
```

This example checks for an authorization header only; it does not verify a JWT.

## 22. Run migrations

To create database tables using generated migration files:

```bash
npx sequelize-cli db:migrate
```

Check migration status:

```bash
npx sequelize-cli db:migrate:status
```

Undo the last migration:

```bash
npx sequelize-cli db:migrate:undo
```

Alternatively, `db.sequelize.sync()` in `app.js` creates tables based on models. Do not use both approaches without planning how schema changes are managed.

## 23. Add npm scripts

In `package.json`:

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  }
}
```

Run:

```bash
npm run dev
```

## 24. API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/employees` | Create employee |
| GET | `/api/employees` | List employees |
| GET | `/api/employees?page=1&limit=10` | Paginated employees |
| GET | `/api/employees/:id` | Employee details |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List projects |
| GET | `/api/projects/:id` | Project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/:id` | Task details |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## 25. HTTP status codes

| Status | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 422 | Validation error |
| 500 | Internal server error |

## 26. Final project structure

```text
employee-management/
│
├── config/
│   └── config.js
│
├── controllers/
│   ├── employeeController.js
│   ├── projectController.js
│   └── taskController.js
│
├── middlewares/
│   └── authMiddleware.js
│
├── migrations/
│
├── models/
│   ├── index.js
│   ├── employee.js
│   ├── project.js
│   └── task.js
│
├── routes/
│   ├── employeeRoutes.js
│   ├── projectRoutes.js
│   └── taskRoutes.js
│
├── seeders/
├── .env
├── .sequelizerc
├── app.js
└── package.json
```
