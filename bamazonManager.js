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

function getUserInput(inputMsg) {
    const quitMe = "Quit";

    let userOptions = [
        {name: "View Products for Sale", value: getProductsForSale},
        {name: "View Low Inventory", value: getLowInventory},
        {name: "Add to Inventory", value: addToInventory},
        {name: "Add New Product", value: addNewProduct},
        {name: quitMe}
    ];
    
    let questions = [
    {
        message: (typeof inputMsg === "undefined") ? "Choose one of the following option" : inputMsg,
        type: "list",
        name: "chosenOption",
        choices: userOptions
    }];

    inquirer.prompt(questions).then(answer => {
        if (answer.chosenOption == quitMe) {
            quitApp();
        }
        else {
            answer.chosenOption().then( () => {
                getUserInput("What would you want to do next");
            }).catch(e => {
                console.log(e);
            })
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
    return new Promise( (resolve, reject) => {
    let queryPromise = runQuery("select * from products", resp => {
        let items = [];
        resp.forEach(i => {
            items.push({ name: i.product_name, value: i.item_id });
        })
        return items;
    })

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

            runQuery(mysql.format(sql, inserts), () => {
                       // VIK_QUESTION: How do I get the value dislayed that user selected in the list?                    
                       let msg = clc.yellow(answer.restockUnits) + 
                       clc.green(" items were successfully added");
                       prettyOutput(msg);
            }).then(resp => {
                resolve(resp);
            }).catch(e => {
                reject(e);
            })
        });
    }).catch(e => { 
        reject(e);
    })
})
}

function addNewProduct() {
    return new Promise( (resolve, reject) => {
    let queryPromise = runQuery("select * from departments", resp => {
        let items = [];
        resp.forEach(i => {
            items.push({ name: i.department_name, value: i.department_id });
        })
        return items;
    })

    queryPromise.then(items => {
        inquirer.prompt(getProductAddQuestions(items)).then(answers => {
            let sql = "insert into products(product_name, dept_id, price, stock_quantity) values(" +
                " ?, ?, ?, ?)";
            let inserts = [answers.product, parseInt(answers.dept), parseFloat(answers.price), parseInt(answers.quantity)];
   
            runQuery(mysql.format(sql, inserts), () => {
                let msg = clc.yellow(answers.quantity) +
                clc.yellow(' \"' + answers.product) +
                clc.green("\" were added at the price of ") +
                clc.yellow(answers.price) +
                clc.green(" each");

                prettyOutput(msg);
            }).then(resp => {
                resolve(resp);
            }).catch(e => {
                reject(e);
            })
        });
    }).catch(e => {
        reject(e);
    })
})
}

function getProductAddQuestions(items) {
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
    return questions;
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

function prettyOutput(msg) {
    console.log(clc.green("-".repeat(msg.length)));
    console.log(msg);
    console.log(clc.green("-".repeat(msg.length)));    
}

function printItems(items) {
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