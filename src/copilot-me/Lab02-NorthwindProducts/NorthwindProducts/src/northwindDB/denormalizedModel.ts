import { Product, Category, Supplier } from "./model";

export interface ProductExt extends Product {
    CategoryName: string,
    SupplierName: string,
    SupplierCity: string,
    InventoryStatus: string
}