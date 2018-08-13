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

function getUserInput(inputMsg) {
    let userOptions = [
        { name: "View Products Sales By Department", value: getSalesByDepartment },
        { name: "Create New Department", value: createNewDepartment },
        { name: "Quit" }
    ];

    let questions = [
        {
            message: (typeof inputMsg === "undefined") ? "Choose one of the action" : inputMsg,
            type: "list",
            name: "chosenOption",
            choices: userOptions
        }];

    inquirer.prompt(questions).then(answer => {
        if (answer.chosenOption == "Quit") {
            quitApp();
            return true;
        }
        answer.chosenOption().then(() => {
            getUserInput("What do you want to do next");
        }).catch(e => {
            console.log(e);
        });
    });
}

function getSalesByDepartment() {
    return new Promise((resolve, reject) => {
        const sql = "select department_id, department_name, over_head_costs, sum(p.product_sales) as product_sales,"
            + " IFNULL(sum( P.product_sales), 0) - over_head_costs as total_profit"
            + " from departments D"
            + " left join products P"
            + " on P.dept_id = D.department_id"
            + " group by D.department_id";

        connection.query(sql, (err, response) => {
            if (err) reject(err);
            else {
                console.log(columnify(response));
                resolve(true);
            }
        });
    });
}

function createNewDepartment() {
    return new Promise( (resolve, reject) => {
        getDepartmentNames().then(items => {
            const questions = getNewDeptQuestions(items);
    
            inquirer.prompt(questions).then(answers => {
                // console.log("***DEBUG***", answers);

                let sql = "insert into departments(department_name, over_head_costs) values(?, ?)";
                const cost = answers.cost;
                let inserts = [answers.department, (cost === "") ? null : parseFloat(cost)];
                sql = mysql.format(sql, inserts);
                let query = connection.query(sql,
                    (err, resp) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            console.log(clc.green("---------------------------------"));
                            console.log(clc.green("Department was successfully added"));
                            console.log(clc.green("---------------------------------"));
                            resolve();
                        }
                    });
                // console.log("***DEBUG***", query.sql);
            });
        })
    })
}

function getDepartmentNames() {
    return new Promise((resolve, reject) => {
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
}

function getNewDeptQuestions(items) {
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

    return questions;
}

function quitApp() {
    connection.end( () => {
        console.log(clc.green("GoodBye!"));
    })
}