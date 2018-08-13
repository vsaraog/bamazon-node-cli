let mysql = require("mysql");
let inquirer = require("inquirer");
let columnify = require('columnify')
let clc = require("cli-color");

let conn = require("./conn-setting");
const LOW_INVENTORY_NUM = 5;

let connection = mysql.createConnection(conn.mysqlConn);
connection.connect(function(err) {
    if (err) throw err;
    getUserInput(); 
})

function getUserInput() {
    let userOptions = [
        {name: "View Products for Sale", value: getProductsForSale},
        {name: "View Low Inventory", value: getLowInventory},
        {name: "Add to Inventory", value: addToInventory},
        {name: "Add New Product", value: addNewProduct},
        {name: "Quit"}
    ];
    
    let questions = [
    {
        message: "Choose one of the option",
        type: "list",
        name: "chosenOption",
        choices: userOptions
    }];

    inquirer.prompt(questions).then(answer => {
        if (answer.chosenOption == "quit") {
            quitApp();
        }
        else {
            answer.chosenOption();
        // VIK_TODO: Uncomment later on
        // getUserInput();
        }
    });
}
/*
* If a manager selects `View Products for Sale`, the app should list every available item: the item IDs, names, prices, and quantities.
  * If a manager selects `View Low Inventory`, then it should list all items with an inventory count lower than five.
  * If a manager selects `Add to Inventory`, your app should display a prompt that will let the manager "add more" of any item currently in the store.
  * If a manager selects `Add New Product`, it should allow the manager to add a completely new product to the store.
*/

function getProductsForSale() {
    return runQuery("select * from products", printItems);
}

function getLowInventory() {
    const sql = "select * from products where stock_quantity < " + LOW_INVENTORY_NUM;
    return runQuery(sql, printItems);
}

function addToInventory() {
    let queryPromise = new Promise( (resolve, reject) => {
        runSelectQuery("select * from products").then(resp => {
            let items = [];
            resp.forEach(i => {
                items.push({ name: i.product_name, value: i.item_id });
            })
            resolve(items);
        }, err => {
            reject(err);
        });
    });

    queryPromise.then( items => {
        let questions = [{
            message: "Select item whose inventory you want to add",
            name: "restockItem",
            type: "list",
            choices: items
        },
        {
            message: "Enter restock quantity of the item",
            name: "restockUnits",
            type: "input",
            validate: validateNumber
        }];

        inquirer.prompt(questions).then(answer => {
            let sql = "update products set stock_quantity = stock_quantity + ? where item_id = ?";
            let inserts = [parseInt(answer.restockUnits), parseInt(answer.restockItem)];
            sql = mysql.format(sql, inserts);

            let query = connection.query(sql,
                (err, resp) => {
                    if (err) throw err;
                    // VIK_QUESTION: How do I get the value dislayed that user selected in the list?
                    console.log(clc.green(answer.restockUnits) + " items were successfully added");
                });
            // console.log("***DEBUG***", query.sql);
        });
    })
    
}

function addNewProduct() {
    let queryPromise = new Promise((resolve, reject) => {
        let sql = "select * from departments";
        runSelectQuery(sql).then(resp => {
            let items = [];
            resp.forEach(i => {
                items.push({ name: i.department_name, value: i.department_id });
            })
            resolve(items);
        }, err => {
            reject(err);
        });
    });

    queryPromise.then(items => {
        let questions = [{
            message: "Enter product name",
            name: "product",
            type: "input",
        },
        {
            message: "Enter product department",
            name: "dept",
            type: "list",
            choices: items
        },
        {
            message: "Enter price of the product",
            name: "price",
            type: "input",
            validate: validatePrice
        },
        {
            message: "Enter stock quantity",
            name: "quantity",
            type: "input",
            validate: validateNumber
        }
        ];

        inquirer.prompt(questions).then(answers => {
            // console.log(answers);

            let sql = "insert into products(product_name, dept_id, price, stock_quantity) values(" +
                " ?, ?, ?, ?)";
            let inserts = [answers.product, parseInt(answers.dept), parseFloat(answers.price), parseInt(answers.quantity)];
            sql = mysql.format(sql, inserts);
            let query = connection.query(sql,
                (err, resp) => {
                    if (err) throw err;
                    console.log(clc.green(answers.quantity) + " " + clc.green(answers.product) + " were added at the price of " + clc.green(answers.price) + " each");
                });
        });
    })
}

function runQuery(sql, callback) {
    return new Promise( (resolve, reject) => {
        // console.log(arguments.callee.name);
        runSelectQuery(sql).then( response => { 
            resolve(callback(response));
        }, error => {
            reject(error);
        });    
    })
    // console.log(arguments); // VIK_QUESTION: Why this doesn't work but above works 
}   

function runSelectQuery(sql) {
    return new Promise(function (resolve, reject) {
        let query = connection.query(sql,
            (err, resp) => {
                if (err) {
                    reject(err);
                }
                else {
                    // console.log(resp);
                    resolve(resp);
                }
            });
        // console.log("***DEBUG***", query.sql);
    })
}

function printItems(items) {
    // items.forEach(e => {
    //     console.log("Id:", e.item_id, 
    //     ", Name: ", e.product_name,
    //     ", Price: ", e.price,
    //     ", Quantity: ", e.stock_quantity);
    // });

    console.log(columnify(items, {
        columns: ['product_name', 'price', 'stock_quantity'],
        config: {
            product_name: {
                headingTransform: () => {
                    return "PRODUCT";
                },
                minWidth: 30
            },
            stock_quantity: {
                headingTransform: () => {
                    return "QUANTITY";
                },
                minWidth: 10
            }
        }
    }
    ));

}

function validateNumber(value) {
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

function validatePrice(value) {
    if (/^[0-9]+[\.]?[0-9]{0,2}$/.test(value) === false) {
        console.log(" Not a valid price");
        return false;
    }
    else if (value == 0) {
        console.log(" Price should be greater than 0");
        return false;
    }
    else {
        return true;
    }
}

function quitApp() {
    connection.end( () => {
        console.log(clc.green("GoodBye!"));
    })
}