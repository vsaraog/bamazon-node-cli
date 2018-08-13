let mysql = require("mysql");
let inquirer = require("inquirer");
let columnify = require('columnify')
let clc = require("cli-color");

const conn = require("./conn-setting");

let connection = mysql.createConnection(conn.mysqlConn);
connection.connect(function(err) {
    if (err) throw err;
    getUserInput();
})

function getUserInput() {
    let userOptions = [
        { name: "View Products Sales By Department", value: getSalesByDepartment },
        { name: "Create New Department", value: createNewDepartment },
        { name: "quit" }
    ];

    let questions = [
        {
            message: "Choose one of the action",
            type: "list",
            name: "supervisorOption",
            choices: userOptions
        }];
    
        inquirer.prompt(questions).then(answer => {
            if (answer.mgrOption == "quit") {
                console.log("Good Bye!");
                return true;
            }
            answer.supervisorOption();
            // getUserInput();
        });
}

function getSalesByDepartment() {
    const sql = "select department_id, department_name, over_head_costs, sum(p.product_sales) as product_sales,"
        + " IFNULL(sum( P.product_sales), 0) - over_head_costs as total_profit"
        + " from departments D"
        + " left join products P"
        + " on P.dept_id = D.department_id"
        + " group by D.department_id";

    connection.query(sql, (err, response) => { 
        if (err) throw err;
        console.log(columnify(response));
    });
}

function createNewDepartment() {
    let queryPromise = new Promise((resolve, reject) => {
        const sql = "select * from departments";
        connection.query(sql, (err, resp) => {
            if (err) {
                reject(err);
            }
            else {
                let items = [];
                resp.forEach(i => {
                    items.push(i.department_name);
                })
                resolve(items);
            }
        });
    });

    queryPromise.then(items => {
        let questions = [{
            message: "Enter department name",
            name: "department",
            type: "input",
            validate: function (value) {
                if (items.findIndex(i => i.toUpperCase() == value.trim().toUpperCase()) != -1) {
                    console.log(clc.red(value + " already exists in database"))
                    return false;
                }
                return true;
            }
        },
        {
            message: "Enter over head cost",
            name: "cost",
            type: "input",
        },
        ];

        inquirer.prompt(questions).then(answers => {
            // console.log(answers);

            let sql = "insert into departments(department_name, over_head_costs) values(?, ?)";
            let inserts = [answers.department, parseFloat(answers.cost)];
            sql = mysql.format(sql, inserts);
            let query = connection.query(sql,
                (err, resp) => {
                    if (err) throw err;
                    console.log("Department was successfully added");
                });
            // console.log("***DEBUG***", query.sql);
        });
    })
}

function testArrayFind() {
    const items = ["toys", "fake", "vikas", "saraogi"];
    const value = process.argv[2];
    if (items.findIndex(i => i.toUpperCase() == value.trim().toUpperCase()) != -1) {
        console.log(clc.red(value + " already exists in database"))
        return false;
    }
    console.log(clc.green(value + " is not in the array "), items);
    return true;
}