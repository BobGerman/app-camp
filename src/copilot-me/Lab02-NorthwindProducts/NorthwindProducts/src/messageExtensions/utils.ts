import { Product } from "../northwindDB/model";

export const CreateInvokeResponse = (body:any) => {
    return { status: 200, body }
};

export const getInventoryStatus=(product:Product)=>{
    if (product.UnitsInStock === 0) {
      return "Out of stock";
    } else if (product.UnitsOnOrder > 0) {
      return "On order";
    } else if (product.UnitsInStock < product.ReorderLevel) {
      return "Low stock";
    } else {
      return "In stock";
    }
  }
