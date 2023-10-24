import {
    CardFactory,
    TurnContext,
    MessagingExtensionQuery,
    MessagingExtensionResponse,
} from "botbuilder";
import { updateProduct, getProduct, getProducts, searchProducts } from "../northwindDB/products";
import { editCard } from './cards/editCard';
import { successCard } from './cards/successCard';
import { errorCard } from './cards/errorCard'
import * as ACData from "adaptivecards-templating";

import { CreateInvokeResponse, getInventoryStatus } from './utils';

const COMMAND_ID = "inventorySearch";

async function handleTeamsMessagingExtensionQuery(
    context: TurnContext,
    query: MessagingExtensionQuery
): Promise<MessagingExtensionResponse> {

    console.log(`🔍 Query JSON:\n${JSON.stringify(query)}`);

    // Unpack the parameters. From Copilot they'll come in the parameters array; from a human they'll be comma separated
    let [productName, categoryName, inventoryStatus, supplierCity, stockLevel] = (query.parameters[0]?.value.split(','));

    // productName = (query.parameters[0]?.value != null && query.parameters[0].value==="*") ? "" : (query.parameters[0]?.value ?? "");

    productName = cleanupParam(query.parameters[0]?.value);
    categoryName ??= cleanupParam(query.parameters[1]?.value);
    inventoryStatus ??= cleanupParam(query.parameters[2]?.value);
    supplierCity ??= cleanupParam(query.parameters[3]?.value);
    stockLevel ??= cleanupParam(query.parameters[4]?.value);
    console.log(`🔎 Processed parameters:\nproductName=${productName}, categoryName=${categoryName}, inventoryStatus=${inventoryStatus}, supplierCity=${supplierCity}, stockLevel=${stockLevel}`);

    const products = await searchProducts(productName, categoryName, inventoryStatus, supplierCity, stockLevel);

    const attachments = [];
    products.forEach((product) => {
        const preview = CardFactory.heroCard(product.ProductName,
            `Supplied by ${product.SupplierName} of ${product.SupplierCity}<br />${product.UnitsInStock} in stock`,
            [product.ImageUrl]);
        var template = new ACData.Template(editCard);
        var card = template.expand({
            $root: {
                productName: product.ProductName,
                unitsInStock: product.UnitsInStock,
                productId: product.ProductID,
                categoryId: product.CategoryID,
                imageUrl: product.ImageUrl,
                supplierName: product.SupplierName,
                supplierCity: product.SupplierCity,
                categoryName: product.CategoryName,
                inventoryStatus: product.InventoryStatus,
                unitPrice: product.UnitPrice,
                quantityPerUnit: product.QuantityPerUnit
            }
        });
        const adaptive = CardFactory.adaptiveCard(card);
        const attachment = { ...adaptive, preview };
        attachments.push(attachment);
    });
    return {
        composeExtension: {
            type: "result",
            attachmentLayout: "list",
            attachments: attachments,
        },
    };
}

function cleanupParam(value: string): string {

    if (!value) {
        return "";
    } else {
        let result = value.trim();
        result = result.split(',')[0];          // Remove extra data
        result = result.replace("*", "");       // Remove wildcard characters from Copilot
        return result;
    }
}


async function handleTeamsCardActionUpdateStock(context: TurnContext) {
    const request = context.activity.value;
    const data = request.action.data;
    if (data.txtStock && data.productId) {
        const product = await getProduct(data.productId);
        product.UnitsInStock = data.txtStock;
        await updateProduct(product);
        var template = new ACData.Template(successCard);    
        var card = template.expand({
            $root: {
                productName: data.productName,
                unitsInStock: data.txtStock,
                productId:  data.productId,
                categoryId:  data.categoryId,
                imageUrl:  data.imageUrl,
                supplierName:  data.supplierName,
                supplierCity:  data.supplierCity,
                categoryName:  data.categoryName,
                inventoryStatus:  data.inventoryStatus,
                unitPrice:  data.unitPrice,
                quantityPerUnit:  data.quantityPerUnit,
                message:`Stock updated for ${data.productName} to ${data.txtStock}!`
            }
        });
        var responseBody = { statusCode: 200, type: "application/vnd.microsoft.card.adaptive", value: card }
        return CreateInvokeResponse(responseBody);

    } else {
        var errorBody = { statusCode: 200, type: "application/vnd.microsoft.card.adaptive", value: errorCard }
        return CreateInvokeResponse(errorBody);
    }
}
async function handelTeamsCardActionCancelRestock(context: TurnContext) {
    const request = context.activity.value;
    const data = request.action.data;
    if (data.productId) {
        const product = await getProduct(data.productId);
        product.ReorderLevel = 0;
        product.UnitsOnOrder = 0;
        await updateProduct(product);
        var template = new ACData.Template(successCard);    
        var card = template.expand({
            $root: {
                productName:data.productName,
                unitsInStock:data.unitsInStock,
                productId:data.productId,
                categoryId:data.categoryId,
                imageUrl:data.imageUrl,
                supplierName:data.supplierName,
                supplierCity:data.supplierCity,
                categoryName:data.categoryName,
                inventoryStatus:getInventoryStatus(product),
                unitPrice:data.unitPrice,
                quantityPerUnit:data.quantityPerUnit,
                message:`Restock cancelled for ${data.productName}.`
            }
        });
        var responseBody = { statusCode: 200, type: "application/vnd.microsoft.card.adaptive", value: card }
        return CreateInvokeResponse(responseBody);

    } else {
        var errorBody = { statusCode: 200, type: "application/vnd.microsoft.card.adaptive", value: errorCard }
        return CreateInvokeResponse(errorBody);
    }
}
async function handelTeamsCardActionRestock(context: TurnContext) {
    const request = context.activity.value;
    const data = request.action.data;
    if (data.productId) {
        const product = await getProduct(data.productId);
        product.UnitsInStock = Number(product.UnitsInStock)+Number(product.ReorderLevel);      
        await updateProduct(product);
        var template = new ACData.Template(successCard);    
        var card = template.expand({
            $root: {
                productName:data.productName,
                unitsInStock:product.UnitsInStock,
                productId:data.productId,
                categoryId:data.categoryId,
                imageUrl:data.imageUrl,
                supplierName:data.supplierName,
                supplierCity:data.supplierCity,
                categoryName:data.categoryName,
                inventoryStatus:getInventoryStatus(product),
                unitPrice:data.unitPrice,
                quantityPerUnit:data.quantityPerUnit,
                message:`Restocked ${data.productName} with ${product.ReorderLevel} units.`
            }
        });
        var responseBody = { statusCode: 200, type: "application/vnd.microsoft.card.adaptive", value: card }
        return CreateInvokeResponse(responseBody);

    } else {
        var errorBody = { statusCode: 200, type: "application/vnd.microsoft.card.adaptive", value: errorCard }
        return CreateInvokeResponse(errorBody);
    }
}
export default { COMMAND_ID, handleTeamsMessagingExtensionQuery, handleTeamsCardActionUpdateStock ,handelTeamsCardActionRestock,handelTeamsCardActionCancelRestock}
