const Pool = require('pg').Pool
const pool = new Pool({
  user:'elmir',
  password:'1011',
  host:'localhost',
  port:5432,
  data:'codeftjs'
})


module.exports = pool