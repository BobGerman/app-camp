import {
    CardFactory,
    TurnContext,
    MessagingExtensionQuery,
    MessagingExtensionResponse,
} from "botbuilder";
import { updateProduct,getProduct,getProducts } from "../northwindDB/products";
import {productCard} from './cards/productCard'
import {stockUpdateSuccess} from './cards/stockUpdateSuccess';
import {errorCard} from './cards/errorCard'
import * as ACData from "adaptivecards-templating";
import * as AdaptiveCards from "adaptivecards";
import { CreateInvokeResponse } from './utils';
import config from "../config";
async function handleTeamsMessagingExtensionQuery(
    context: TurnContext,
    query: MessagingExtensionQuery
): Promise<MessagingExtensionResponse> {
    const searchQuery = query.parameters[0].value;
    const products = await getProducts(searchQuery);
    const attachments = [];
    products.forEach((pdt) => {      
        const preview = CardFactory.heroCard(pdt.ProductName);       
        var template = new ACData.Template(productCard);
        const imageGenerator = Math.floor((pdt.ProductID / 1) % 10);       
        //const imgUrl = `https://${process.env.HOST_NAME}/images/${imageGenerator}.PNG`
        const imgUrl = `https://source.unsplash.com/random/200x200?sig=${imageGenerator}`;
        var card = template.expand({
            $root: {
                productName: pdt.ProductName, unitsInStock: pdt.UnitsInStock,
                productId: pdt.ProductID, categoryId: pdt.CategoryID, imageUrl: imgUrl
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
    if (request) {
        if (request.action.verb === 'ok') {
            const data = request.action.data;
            const product=await getProduct(data.pdtId);
            product.UnitsInStock=data.txtStock;
            await updateProduct(product);
            var template = new ACData.Template(stockUpdateSuccess);
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
}
export default { handleTeamsMessagingExtensionQuery,handleTeamsCardActionInvoke }

