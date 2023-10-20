import {
    TABLE_NAME, Product, ProductEx, Supplier, Category
} from './model';

import { TableClient } from "@azure/data-tables";
import config from "../config";

// NOTE: We're force fitting a relational database into a non-relational database so please
// forgive the inefficiencies. This is just for demonstration purposes.

export async function searchProducts(productName: string, categoryName: string, inventoryStatus: string,
    supplierCity: string, supplierName: string): Promise<Product[]> {

    const categories = await loadReferenceData<Category>(TABLE_NAME.CATEGORY);
    const suppliers = await loadReferenceData<Supplier>(TABLE_NAME.SUPPLIER);
    const tableClient = TableClient.fromConnectionString(config.tableConnectionString, TABLE_NAME.PRODUCT);

    const entities = tableClient.listEntities();

    let products = [];
    for await (const entity of entities) {
        products.push(entity);
    }

    // Denormalize products 
    const productsEx = products as ProductEx[]; 
    for await (const p of productsEx) {
        p.CategoryName = categories[p.CategoryID].CategoryName;
        p.SupplierName = suppliers[p.SupplierID].CompanyName;
        p.SupplierCity = suppliers[p.SupplierID].City;
        // 'in stock', 'low stock', 'on order', or 'out of stock'
        p.InventoryStatus = "In stock";
        if (p.UnitsInStock == 0) p.InventoryStatus = "Out of stock";
        if (p.UnitsOnOrder > 0) p.InventoryStatus = "On order";
        if (p.UnitsInStock < p.ReorderLevel) p.InventoryStatus = "Need to order";
    }

    // Filter products
    let result = productsEx;
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
    if (supplierName) {
        result = result.filter((p) => p.SupplierName.toLowerCase().startsWith(supplierName.toLowerCase()));
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
};

export async function getProduct(productId: number): Promise<Product> {
    const tableClient = TableClient.fromConnectionString(config.tableConnectionString, TABLE_NAME.PRODUCT);
    const product = await tableClient.getEntity(TABLE_NAME.PRODUCT, productId.toString()) as Product;
    return product;
};

export async function updateProduct(updatedProduct: Product): Promise<void> {
    const tableClient = TableClient.fromConnectionString(config.tableConnectionString, TABLE_NAME.PRODUCT);
    const product = await tableClient.getEntity(TABLE_NAME.PRODUCT, updatedProduct.ProductID.toString()) as Product;
    if (!product) {
        throw new Error("Product not found");
    }
    await tableClient.updateEntity({ ...product, ...updatedProduct }, "Merge");
};


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


