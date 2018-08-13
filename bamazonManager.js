let mysql = require("mysql");
let inquirer = require("inquirer");
let columnify = require('columnify')
let conn = require("./conn-setting");
const LOW_INVENTORY_NUM = 50; // VIK_TODO: Change this to 5 later on

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
        {name: "quit"}
    ];
    
    let questions = [
    {
        message: "Id of the product you want to buy?",
        type: "list",
        name: "mgrOption",
        choices: userOptions
    }];

    inquirer.prompt(questions).then(answer => {
        if (answer.mgrOption == "quit") {
            console.log("Good Bye!");
            return true;
        }
        // console.log(answer.mgrOption);
        answer.mgrOption();
        // VIK_TODO: Uncomment later on
        // getUserInput();
    });
}
/*
* If a manager selects `View Products for Sale`, the app should list every available item: the item IDs, names, prices, and quantities.
  * If a manager selects `View Low Inventory`, then it should list all items with an inventory count lower than five.
  * If a manager selects `Add to Inventory`, your app should display a prompt that will let the manager "add more" of any item currently in the store.
  * If a manager selects `Add New Product`, it should allow the manager to add a completely new product to the store.
*/

function getProductsForSale() {
    console.log(arguments.callee.name);

    runSelectQuery("select * from products").then( response => { 
        printItems(response)
    }, error => {
        throw error;
    });
    // console.log(arguments); // VIK_QUESTION: Why this doesn't work but above works 
}   

function getLowInventory() {
    const sql = "select * from products where stock_quantity < " + LOW_INVENTORY_NUM;
    runSelectQuery(sql).then(resp => {
        printItems(resp);
    }, err => {
        throw err;
    });
}

function addToInventory() {

    // console.log(arguments.callee.name);
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
                    console.log("Item was updated");
                });
            console.log("***DEBUG***", query.sql);
        });
    })
    
}

function addNewProduct() {
    let queryPromise = new Promise( (resolve, reject) => {
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

    queryPromise.then( items => {
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
        console.log(answers);

    let sql = "insert into products(product_name, dept_id, price, stock_quantity) values(" + 
    " ?, ?, ?, ?)";
    let inserts = [answers.product, parseInt(answers.dept), parseFloat(answers.price), parseInt(answers.quantity)];
    sql = mysql.format(sql, inserts);
    let query = connection.query(sql,
        (err, resp) => {
            if (err) throw err;
            console.log("Product was added");
        });
    // console.log("***DEBUG***", query.sql);
});
    })
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
        console.log(query.sql);
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