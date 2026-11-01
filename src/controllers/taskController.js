const db = require('../models/');

const create = async(req, res) => {
    const { project_id, employee_id, title } = req.body;

    await db.Task.create({
        projectId: project_id,
        employeeId: employee_id,
        title: title
    })

    res.status(201).json({success: true, message: 'Created successfull'});
} 

const get = async(req, res) => {

    const { status, project_id, sort_by } = req.query;

    const whereClause = {};

    if(status){
        whereClause.status = status;
    }
    
    if(project_id){
        whereClause.projectId = project_id;
    }

    const orderClause = [];
    
    if(sort_by === 'due_date'){
        orderClause.push(['due_date', 'desc']);
    }


    const project = await db.Task.findAll({
        where: whereClause,
        include: [
            {
                model: db.Project,
                as: 'project',
                attributes: [
                    'name',
                ]
            },
            {
                model: db.Employee,
                as: 'employee',
                attributes: [
                    'name',
                ]
            }
        ],
        order: orderClause
    })

    res.status(200).json({success: true, data: project});
} 

const update = async(req, res) => {
    const { project_id, employee_id, title } = req.body;
    const { id } = req.params;

    const task = await db.Task.findByPk(id);
    if(task){
        const updatedTask = await task.update({projectId : project_id, employeeId: employee_id, title});

        return res.status(201).json({success: true, data: updatedTask });
    }


    return res.status(404).json({success: false, message: "not found" });

}

module.exports = {
    create,
    get,
    update
}