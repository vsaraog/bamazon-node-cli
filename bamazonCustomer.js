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
    let query = connection.query("select P.*, D.department_name from products P" +
    " inner join departments D on D.department_id = P.dept_id" + 
    " order by P.item_id", 
    function (err, resp) {
        if (err) throw err;
        // console.log(resp);
        printItems(resp);
        prompUser(resp).then( () => {
            connection.end( () => {
                console.log("GoodBye!");
            })
        }).catch(e => { 
            console.log(e);
        })
    });
}

function printItems(items) {
    console.log(columnify(items, {
        columns: ['item_id', 'product_name', 'department_name', 'price'],
        config: {
            item_id: {
                headingTransform: () => {
                    return "ID";
                },
                minWidth: 5
            },
            product_name: {
                headingTransform: () => {
                    return "PRODUCT";
                },
                minWidth: 40
            },
            department_name: {
                headingTransform: () => {
                    return "DEPARTMENT";
                },
                minWidth: 30
            }
        }
    }
    ));

}

function prompUser(items) {
    return new Promise((resolve, reject) => {

        inquirer.prompt(getUserQuestions(items)).then(answers => {
            const elems = items.filter(it => { return (it.item_id == answers.itemId) });
            // console.log("****DEBUG****", elems);
            const purchasedUnits = parseInt(answers.units);
            const remainingUnits = parseInt(elems[0].stock_quantity) - purchasedUnits;
            if (remainingUnits < 0) {
                console.log(clc.green("----------------------"));
                console.log(clc.green("Insufficient quantity!"));
                console.log(clc.green("----------------------"));
            }
            else {
                const itemPrice = parseFloat(elems[0].price)
                const totalCost = purchasedUnits * itemPrice;
                let query = connection.query("UPDATE products SET ?, product_sales = product_sales + ? WHERE ?",
                    [
                        { stock_quantity: remainingUnits },
                        totalCost,
                        { item_id: parseInt(answers.itemId) }
                    ],
                    function (err, resp, fields) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            const msg = clc.yellow(purchasedUnits) +
                                clc.green(" items bought at the price of ") +
                                clc.yellow(itemPrice.toFixed(2)) +
                                clc.green(" each. Total cost: ") +
                                clc.yellow(totalCost.toFixed(2));

                            console.log(clc.green("-".repeat(msg.length)));
                            console.log(msg);
                            console.log(clc.green("-".repeat(msg.length)));
                            resolve();
                        }
                    });

                // console.log("***DEBUG***", query.sql);
            }
            return true;
        });
    })

}

function getUserQuestions(items) {
    var questions = [
        {
            message: "Id of the product you want to buy?",
            type: "input",
            name: "itemId",
            validate: function(value) {
                function isValidId(items, id) {
                    var it = items.filter(elem => { return (elem.item_id == id)});
                    return (it.length > 0);
                }

                if (isValidId(items, value)) {
                    return true;
                }
                else {
                    return(value + " is not a valid Id");
                }
            }
        },
    {
        message: "Number of units that you want to buy?",
        type: "input",
        name: "units", 
        validate: validateInteger 
    }];

    return questions;
}

function validateInteger(value) {
    if (/^[0-9]+$/.test(value) === false) {
        return (" Number of units should be an integer");
    }
    else if (value == 0) {
        return (" Number should be greater than 0");
    }
    else {
        return true;
    }
}