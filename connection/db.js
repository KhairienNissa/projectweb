const {Pool} = require('pg')

const dbPool = new Pool({
    database: 'project_web',
    port: 5432,
    user: 'postgres',
    password: 'khairien'
})

module.exports = dbPool