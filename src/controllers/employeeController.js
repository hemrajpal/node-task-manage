const db = require('../models');
const { Op } = require('sequelize');

const create = async(req, res) => {
    const { name, email, department, salary } = req.body;

    await db.Employee.create({
        name: name,
        email: email, 
        department: department,
        salary: salary
    })

    res.status(201).json({success: true, message: "Created successful"})
}

const get = async(req, res) => {

    const { page = 1, search, department, salarySort } = req.query;
    const limit = 10;
    const offset = (parseInt(page, 10) - 1) * limit;

    const whereClause = {};

    if (search) {
        whereClause[Op.or] = [
            { name: { [Op.like]: `%${search}%` } }
        ];
    }

    if(department){
        whereClause.department = department; 
    }

    const orderClause = [];

    if(salarySort){
        orderClause.push(['salary', salarySort])
    } else{
        orderClause.push(['createdAt', 'DESC'])
    }

    const {count, rows} = await db.Employee.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: orderClause
    });

    const data = {
        page: page,
        total_count: count,
        total_pages: Math.ceil(count / limit),
        result: rows
    }

    res.status(200).json({
        success: true, data: data
    })
}

module.exports = {
    create,
    get
}