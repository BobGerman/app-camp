import {
  TeamsActivityHandler,
  TurnContext,
  MessagingExtensionQuery,
  MessagingExtensionResponse,
  InvokeResponse
} from "botbuilder";
import productSearchME from "./messageExtensions/productSearchME";
export class SearchApp extends TeamsActivityHandler {
  constructor() {
    super();   
  }

  // Search.
  public async handleTeamsMessagingExtensionQuery(
    context: TurnContext,
    query: MessagingExtensionQuery
  ): Promise<MessagingExtensionResponse> {

    const meName = query.parameters[0].name;
    switch (meName) {
      case "productName": {
        return productSearchME.handleTeamsMessagingExtensionQuery(context, query);
      }
    }

  }

// On Activity Invoke.
  public async onInvokeActivity(context:TurnContext): Promise<InvokeResponse> {
    let runEvents = true;
    try {      
        switch (context.activity.name) {
          case 'adaptiveCard/action':
            return productSearchME.handleTeamsCardActionInvoke(context);
          default:
            runEvents = false;
            return super.onInvokeActivity(context);        
      }
    } catch (err) {
      if (err.message === 'NotImplemented') {
        return { status: 501 };
      } else if (err.message === 'BadRequest') {
        return { status: 400 };
      }
      throw err;
    } finally {
      if (runEvents) {
        this.defaultNextEvent(context)();
      }
    }
  }
}

