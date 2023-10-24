import { Product } from "../northwindDB/model";

export const CreateInvokeResponse = (body:any) => {
    return { status: 200, body }
};

export const getInventoryStatus=(product:Product)=>{
    if (Number(product.UnitsInStock) === 0) {
      return "Out of stock";
    } else if (Number(product.UnitsOnOrder) > 0) {
      return "On order";
    } else if (Number(product.UnitsInStock) < Number(product.ReorderLevel)) {
      return "Low stock";
    } else {
      return "In stock";
    }
  }
