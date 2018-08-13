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
        prompUser(resp);
    });

    // console.log("***DEBUG***", query.sql);
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

function processAnswers(answers){
  console.log("And your answers are:", answers);
}

function prompUser(items) {
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
                    console.log(" ", value, " is not a valid Id");
                    return false;
                }
            }
        },
    {
        message: "Number of units that you want to buy?",
        type: "input",
        name: "units", 
        validate: validateInteger 
    }];

    inquirer.prompt(questions).then(answers => {
        const elems = items.filter(it => {return (it.item_id == answers.itemId)});
        // console.log("****DEBUG****", elems);
        const purchasedUnits = parseInt(answers.units);
        const remainingUnits = parseInt(elems[0].stock_quantity) - purchasedUnits;
        if (remainingUnits < 0) {
            console.log("Insufficient quantity!");
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
                    if (err) throw err;
                    const msg = clc.red(purchasedUnits) + " items bought at the price of " + clc.red(itemPrice) + " each";
                    console.log(msg);
                    console.log("Total cost: " + clc.red(totalCost));
                });

            // console.log("***DEBUG***", query.sql);
        }
        return true;
    });
}

function validateInteger(value) {
    if (/^[0-9]+$/.test(value) === false) {
        console.log(" Number of units should be an integer");
        return false;
    }
    else if (value == 0) {
        console.log(" Number should be greater than 0");
        return false;
    }
    else {
        return true;
    }
}