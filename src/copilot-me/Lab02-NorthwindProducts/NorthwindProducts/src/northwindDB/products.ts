import {
    TABLE_NAME, Product, ProductEx, Supplier, Category
} from './model';

import { TableClient } from "@azure/data-tables";
import config from "../config";

// NOTE: We're force fitting a relational database into a non-relational database so please
// forgive the inefficiencies. This is just for demonstration purposes.

export async function searchProducts(productName: string, categoryName: string, inventoryStatus: string,
    supplierCity: string, stockLevel: string): Promise<ProductEx[]> {

    let result = await getAllProductsEx();

    // Filter products
    if (productName) {
        result = result.filter((p) => p.ProductName.toLowerCase().startsWith(productName.toLowerCase()));
    }
    if (categoryName) {
        result = result.filter((p) => p.CategoryName.toLowerCase().startsWith(categoryName.toLowerCase()));
    }
    if (inventoryStatus) {
        result = result.filter((p) => p.InventoryStatus.toLowerCase().startsWith(inventoryStatus.toLowerCase()));
    }
    if (supplierCity) {
        result = result.filter((p) => p.SupplierCity.toLowerCase().startsWith(supplierCity.toLowerCase()));
    }
    if (stockLevel) {
        result = result.filter((p) => isInRange(stockLevel, p.UnitsInStock));
    }

    return result;
}

// Used to filter based on a range entered in the stockLevel parameter
// Returns true iff a value is within the range specified in the range expression
function isInRange(rangeExpression: string, value: number) {

    let result = false;     // Return false if the expression is malformed

    if (rangeExpression.indexOf('-')< 0) {
        // If here, we have a single value or a malformed expression
        const val = Number(rangeExpression);
        if (!isNaN(val)) {
            result = value === val;
        }
    } else if (rangeExpression.indexOf('-') === rangeExpression.length-1) {
        // If here we have a single lower bound or a malformed expression
        const lowerBound = Number(rangeExpression.slice(0,-1));
        if (!isNaN(lowerBound)) {
            result = value >= lowerBound;
        }
    } else {
        // If here we have a range or a malformed expression
        const bounds = rangeExpression.split('-');
        const lowerBound = Number(bounds[0]);
        const upperBound = Number(bounds[1]);
        if (!isNaN(lowerBound) && !isNaN(upperBound)) {
            result = lowerBound <= value && upperBound >= value;
        }
    }
    return result;
}

interface ReferenceData<DataType> {
    [index: string]: DataType;
}

async function loadReferenceData<DataType>(tableName): Promise<ReferenceData<DataType>> {

    const tableClient = TableClient.fromConnectionString(config.tableConnectionString, tableName);

    const entities = tableClient.listEntities();

    let result = {};
    for await (const entity of entities) {
        result[entity.rowKey] = entity;
    }
    return result;

}

// Reference tables never change in this demo app - so they're cached here
let categories: ReferenceData<Category> = null;
let suppliers: ReferenceData<Supplier> = null;

async function getAllProductsEx(): Promise<ProductEx[]> {

    // Ensure reference data are loaded
    categories = categories ?? await loadReferenceData<Category>(TABLE_NAME.CATEGORY);
    suppliers = suppliers ?? await loadReferenceData<Supplier>(TABLE_NAME.SUPPLIER);

    // We always read the products fresh in case somebody made a change
    const result: ProductEx[] = [];
    const tableClient = TableClient.fromConnectionString(config.tableConnectionString, TABLE_NAME.PRODUCT);

    const entities = tableClient.listEntities();

    for await (const entity of entities) {
        let p: ProductEx = {
            etag: entity.etag as string,
            partitionKey: entity.partitionKey as string,
            rowKey: entity.rowKey as string,
            timestamp: new Date(entity.timestamp),
            ProductID: entity.ProductID as string,
            ProductName: entity.ProductName as string,
            SupplierID: entity.SupplierID as string,
            CategoryID: entity.CategoryID as string,
            QuantityPerUnit: entity.QuantityPerUnit as string,
            UnitPrice: Number(entity.UnitPrice),
            UnitsInStock: Number(entity.UnitsInStock),
            UnitsOnOrder: Number(entity.UnitsOnOrder),
            ReorderLevel: Number(entity.ReorderLevel),
            Discontinued: entity.Discontinued as boolean,
            ImageUrl: entity.ImageUrl as string,
            CategoryName: "",
            SupplierName: "",
            SupplierCity: "",
            InventoryStatus: ""
        };
        // Fill in extended properties
        p.CategoryName = categories[p.CategoryID].CategoryName;
        p.SupplierName = suppliers[p.SupplierID].CompanyName;
        p.SupplierCity = suppliers[p.SupplierID].City;
        // 'in stock', 'low stock', 'on order', or 'out of stock'
        p.InventoryStatus = "In stock";
        if (p.UnitsInStock == 0) p.InventoryStatus = "Out of stock";
        if (p.UnitsOnOrder > 0) p.InventoryStatus = "On order";
        if (p.UnitsInStock < p.ReorderLevel) p.InventoryStatus = "Low stock";    
        result.push(p);
    }
    return result;
}

export async function getProducts(startsWith: string): Promise<Product[]> {

    const tableClient = TableClient.fromConnectionString(config.tableConnectionString, TABLE_NAME.PRODUCT);

    const entities = tableClient.listEntities();

    let result = [];
    for await (const entity of entities) {
        if (startsWith && (entity.ProductName as string).toLowerCase().startsWith(startsWith.toLowerCase())) {
            result.push(entity);
        }
    }
    return result;
}

export async function getProduct(productId: number): Promise<Product> {
    const tableClient = TableClient.fromConnectionString(config.tableConnectionString, TABLE_NAME.PRODUCT);
    const product = await tableClient.getEntity(TABLE_NAME.PRODUCT, productId.toString()) as Product;
    return product;
}

export async function updateProduct(updatedProduct: Product): Promise<void> {
    const tableClient = TableClient.fromConnectionString(config.tableConnectionString, TABLE_NAME.PRODUCT);
    const product = await tableClient.getEntity(TABLE_NAME.PRODUCT, updatedProduct.ProductID.toString()) as Product;
    if (!product) {
        throw new Error("Product not found");
    }
    await tableClient.updateEntity({ ...product, ...updatedProduct }, "Merge");
}


// #region -- NOT USED, NOT TESTED ---------------------------------------------------------

// export async function createProduct (product: Product): Promise<void> {
//     const newProduct: Product = {
//         partitionKey: TABLE_NAME.PRODUCT,
//         rowKey: product.ProductID,
//         ...product,
//     }
//     const tableClient = TableClient.fromConnectionString(config.tableConnectionString, TABLE_NAME.PRODUCT);
//     await tableClient.createEntity(newProduct);
// };

// export async function deleteProduct (productId: number): Promise<void> {
//     const tableClient = TableClient.fromConnectionString(config.tableConnectionString, TABLE_NAME.PRODUCT);
//     await tableClient.deleteEntity(TABLE_NAME.PRODUCT, productId.toString());
// };

//#endregion


