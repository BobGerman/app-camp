import {
    CardFactory,
    TurnContext,
    MessagingExtensionQuery,
    MessagingExtensionResponse,
} from "botbuilder";
import { updateProduct, getProduct, getProducts, searchProducts } from "../northwindDB/products";
import {editCard} from './cards/editCard';
import {successCard} from './cards/successCard';
import {errorCard} from './cards/errorCard'
import * as ACData from "adaptivecards-templating";

import { CreateInvokeResponse } from './utils';

const COMMAND_ID = "inventorySearch";

async function handleTeamsMessagingExtensionQuery(
    context: TurnContext,
    query: MessagingExtensionQuery
): Promise<MessagingExtensionResponse> {

    // Unpack the parameters. From Copilot they'll come in the parameters array; from a human they will
    // be comma separated
    // let params =  query.parameters[0]?.value.split(',');
    let [ productName, categoryName, inventoryStatus, supplierCity, supplierName ] = (query.parameters[0]?.value.split(','));

    productName ??= query.parameters[0]?.value ?? "";
    categoryName ??= query.parameters[1]?.value ?? "";
    inventoryStatus ??= query.parameters[2]?.value ?? "";
    supplierCity ??= query.parameters[2]?.value ?? "";
    supplierName ??= query.parameters[3]?.value ?? "";

    console.log(`Received search productName=${productName}, categoryName=${categoryName}, inventoryStatus=${inventoryStatus}, supplierCity=${supplierCity}, supplierName=${supplierName}`);
    const products = await  searchProducts(productName, categoryName, inventoryStatus, supplierCity, supplierName);

    const attachments = [];
    products.forEach((pdt) => {      
        const preview = CardFactory.heroCard(pdt.ProductName);       
        var template = new ACData.Template(editCard);
        var card = template.expand({
            $root: {
                productName: pdt.ProductName, 
                unitsInStock: pdt.UnitsInStock,
                productId: pdt.ProductID, 
                categoryId: pdt.CategoryID, 
                imageUrl: pdt.ImageUrl,
                supplierName: pdt.SupplierName,
                supplierCity: pdt.SupplierCity,
                categoryName: pdt.CategoryName,
                inventoryStatus:pdt.InventoryStatus,
                unitPrice:pdt.UnitPrice,
                quantituPerUnit:pdt.QuantityPerUnit
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

async function handleTeamsCardActionInvoke(context: TurnContext) {
    const request = context.activity.value;
    const data = request.action.data;
    if (data.txtStock && data.pdtId) {  
            const product=await getProduct(data.pdtId);
            product.UnitsInStock=data.txtStock;
            await updateProduct(product);
            var template = new ACData.Template(successCard);
            const imageGenerator = Math.floor((data.pdtId / 1) % 10);
            const imgUrl = `https://source.unsplash.com/random/200x200?sig=${imageGenerator}`;
            var card = template.expand({
                $root: {
                    productName: data.pdtName, unitsInStock: data.txtStock,
                    imageUrl: imgUrl
                }
            });          
            var responseBody = { statusCode: 200, type: "application/vnd.microsoft.card.adaptive", value: card }                                
            return CreateInvokeResponse(responseBody);

        } else {
            var errorBody = { statusCode: 200, type: "application/vnd.microsoft.card.adaptive", value: errorCard }                              
             return CreateInvokeResponse(errorBody);
        }
    }
export default { COMMAND_ID, handleTeamsMessagingExtensionQuery,handleTeamsCardActionInvoke }
