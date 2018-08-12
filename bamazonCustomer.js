let mysql = require("mysql");
let inquirer = require("inquirer");
let columnify = require('columnify')
let conn = require("./conn-setting");

let connection = mysql.createConnection(conn.mysqlConn);
connection.connect(function(err) {
    if (err) throw err;
    getUserInput();
})

function getUserInput() {
    let query = connection.query("select P.*, D.department_name from products P" +
    " inner join departments D on D.department_id = P.dept_id", 
    function (err, resp) {
        if (err) throw err;
        // console.log(resp);
        printItems(resp);
        prompUser(resp);
    });

    console.log("***DEBUG***", query.sql);
}

function printItems(items) {
    // items.forEach(e => {
    //     console.log("Id:", e.item_id, 
    //     ", Name: ", e.product_name,
    //     ", Price: ", e.price);
    // });

    console.log(columnify(items, {
        columns: ['product_name', 'department_name', 'price'],
        config: {
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
        validate: function(value) {
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
    }];

    inquirer.prompt(questions).then(answers => {
        const elems = items.filter(it => {return (it.item_id == answers.itemId)});
        console.log(elems);
        const purchasedUnits = parseInt(answers.units);
        const remainingUnits = parseInt(elems[0].stock_quantity) - purchasedUnits;
        if (remainingUnits < 0) {
            console.log("Insufficient quantity!");
        }
        else {
            let query = connection.query("UPDATE products SET ? WHERE ?",
                [{ stock_quantity: remainingUnits }, { item_id: parseInt(answers.itemId) }],
                function (err, resp, fields) {
                    if (err) throw err;
                    console.log("Total cost: ", purchasedUnits * parseFloat(elems[0].price));
                });

            // console.log("***DEBUG***", query.sql);
        }
        return true;
    });
}